"""Prepare a prefecture-clipped elevation mesh from pinned, attributed data.
Usage: python build-terrain.py --data DATA_DIRECTORY [--fetch]
Dependencies: numpy, Pillow, shapely==2.1.2, pyproj==3.7.2, triangle==20250106.
The optional fetch downloads only missing public GSI tiles, with 4 workers.
"""
import argparse, concurrent.futures, hashlib, io, json, math, pathlib, time, urllib.request, urllib.error
import numpy as np
from PIL import Image
from shapely.geometry import shape, Polygon, mapping
from shapely.ops import transform
from pyproj import Transformer
import triangle

ROOT = pathlib.Path(__file__).resolve().parents[2]
CONFIG = json.loads((ROOT/'map3d/config.json').read_text(encoding='utf-8'))
REGIONS = json.loads((ROOT/'map3d/regions.json').read_text(encoding='utf-8'))
PROJECT = Transformer.from_crs('EPSG:4326', 'EPSG:3857', always_xy=True)
INVERSE = Transformer.from_crs('EPSG:3857', 'EPSG:4326', always_xy=True)
E0, N0 = PROJECT.transform(CONFIG['originLongitudeDeg'], CONFIG['originLatitudeDeg'])
S = CONFIG['metersToWorld']
R = 6378137
Z = CONFIG['demZoom']
PIXEL_METERS = 2*math.pi*R/(256*2**Z)
NAMES = '北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県'.split()

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def pixels(e,n): return (e+math.pi*R)/PIXEL_METERS, (math.pi*R-n)/PIXEL_METERS
def polygons(g): return [g] if g.geom_type == 'Polygon' else [p for p in g.geoms if p.geom_type=='Polygon']

def triangulate(poly):
    vertices, segments, holes = [], [], []
    for index, ring in enumerate([poly.exterior, *poly.interiors]):
        # Subdivide long edges so neighbouring prefectures share shoreline resolution.
        coords=list(ring.segmentize(1500).coords)[:-1]
        start=len(vertices)
        vertices.extend(coords)
        segments.extend((start+i,start+(i+1)%len(coords)) for i in range(len(coords)))
        if index:
            p=Polygon(ring).representative_point(); holes.append((p.x,p.y))
    if len(vertices)<3 or poly.area<1: return None
    data={'vertices': np.array(vertices), 'segments': np.array(segments)}
    if holes: data['holes']=np.array(holes)
    return triangle.triangulate(data, f'pq20a{CONFIG["maximumTriangleAreaM2"]}Q')

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--data',type=pathlib.Path,required=True); parser.add_argument('--fetch',action='store_true'); args=parser.parse_args()
    data=args.data; cache=data/'tiles'; cache.mkdir(exist_ok=True)
    source=data/'prefectures-source.geojson'
    features=json.loads(source.read_text(encoding='utf-8'))['features']
    assert len(features)==47 and sorted(f['properties']['shapeISO'] for f in features)==[f'JP-{i:02}' for i in range(1,48)]
    meshes=[]; tiles=set(); area_before=0; area_after=0
    for f in sorted(features,key=lambda f:f['properties']['shapeISO']):
        pid=int(f['properties']['shapeISO'][3:]); region=next(r for r in REGIONS if pid in r['prefectures'])
        geom=transform(PROJECT.transform,shape(f['geometry'])); area_before+=geom.area
        geom=geom.simplify(CONFIG['simplificationMeters'],preserve_topology=True); area_after+=geom.area
        assert geom.is_valid, f'Invalid boundary: {pid}'
        verts=[]; faces=[]; outlines=[]
        for poly in polygons(geom):
            result=triangulate(poly)
            if result is None: continue
            assert 'triangles' in result
            start=len(verts); verts.extend(result['vertices'].tolist()); faces.extend((result['triangles']+start).tolist())
            for ring in [poly.exterior,*poly.interiors]: outlines.append(list(ring.segmentize(1500).coords))
        for e,n in verts:
            px,py=pixels(e,n)
            # A small collar supports nearest land samples at coastlines.
            for dx in [-3,0,3]:
                for dy in [-3,0,3]: tiles.add((int((px+dx)//256),int((py+dy)//256)))
        meshes.append({'id':f'JP-{pid:02}','prefecture':NAMES[pid-1],'regionId':region['id'],'verticesEN':verts,'faces':faces,'outlinesEN':outlines})
        print(f'Prepared {pid:02} {len(verts)} vertices / {len(faces)} triangles',flush=True)
    print(f'DEM tiles: {len(tiles)} x two sources (DEM10B, DEMGM fallback)',flush=True)
    def fetch(job):
        layer,x,y=job; dest=cache/f'{layer}-{Z}-{x}-{y}.png'
        if dest.exists() or dest.with_suffix('.missing').exists(): return
        if not args.fetch: raise RuntimeError(f'Missing tile: {dest}')
        url=f'https://cyberjapandata.gsi.go.jp/xyz/{layer}/{Z}/{x}/{y}.png'
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url,timeout=30) as response: raw=response.read()
                im=Image.open(io.BytesIO(raw)); assert im.size==(256,256)
                dest.write_bytes(raw); return
            except urllib.error.HTTPError as exc:
                if exc.code==404: dest.with_suffix('.missing').write_text(url); return
                if attempt==2: raise
            except Exception:
                if attempt==2: raise
            time.sleep(1+attempt)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(fetch,[(layer,x,y) for layer in ['dem_png','demgm_png'] for x,y in sorted(tiles)]))
    rasters={}
    for layer in ['dem_png','demgm_png']:
        for x,y in tiles:
            file=cache/f'{layer}-{Z}-{x}-{y}.png'
            if not file.exists(): continue
            rgb=np.asarray(Image.open(file).convert('RGB'),dtype=np.int32)
            val=rgb[:,:,0]*65536+rgb[:,:,1]*256+rgb[:,:,2]
            arr=np.where(val>8388608,val-16777216,val).astype(float)*.01
            arr[val==8388608]=np.nan
            rasters[layer,x,y]=arr
    counts={'dem10b':0,'dem10b_near_coast':0,'demgm':0,'demgm_near_coast':0}; height_cache={}
    def elevation(e,n):
        key=(round(e,5),round(n,5))
        if key in height_cache:return height_cache[key]
        px,py=pixels(e,n); ix,iy=int(px),int(py)
        for layer,label in [('dem_png','dem10b'),('demgm_png','demgm')]:
            for radius in range(4):
                samples=[]
                for dx in range(-radius,radius+1):
                    for dy in range(-radius,radius+1):
                        if max(abs(dx),abs(dy))!=radius:continue
                        x,y=ix+dx,iy+dy; tile=rasters.get((layer,x//256,y//256))
                        if tile is not None and np.isfinite(tile[y%256,x%256]): samples.append(float(tile[y%256,x%256]))
                if samples:
                    h=sum(samples)/len(samples); counts[label if radius==0 else label+'_near_coast']+=1
                    height_cache[key]=h; return h
        raise RuntimeError(f'No elevation available at {INVERSE.transform(e,n)}; refusing to invent height')
    outlines=[]; maxh=-math.inf; minh=math.inf; meta=[]
    for mesh in meshes:
        positions=[]; heights=[]
        for e,n in mesh.pop('verticesEN'):
            h=elevation(e,n); heights.append(h); positions.append([(e-E0)*S,(n-N0)*S,h*S]) # Blender X east, Y north, Z up
            maxh=max(maxh,h); minh=min(minh,h)
        mesh['vertices']=positions; mesh['heights']=heights
        rings=[]
        for ring in mesh.pop('outlinesEN'):
            rings.append([[round((e-E0)*S,5),round(elevation(e,n)*S,5),round(-(n-N0)*S,5)] for e,n in ring])
        outlines.append({'id':mesh['id'],'regionId':mesh['regionId'],'rings':rings})
        meta.append({'id':mesh['id'],'name':mesh['prefecture'],'regionId':mesh['regionId'],'vertices':len(positions),'triangles':len(mesh['faces'])})
    points=[('origin',138,37,0),('north',141.3545,43.0618,25),('center',138.7274,35.3606,3776),('south',130.5571,31.5966,10),('island',124.1572,24.3448,5),('ogasawara',142.1919,27.0944,15)]
    calibration=[]
    for name,lon,lat,h in points:
        e,n=PROJECT.transform(lon,lat)
        calibration.append({'id':name,'longitudeDeg':lon,'latitudeDeg':lat,'heightMeters':h,'projected':[e,n],'world':[(e-E0)*S,h*S,-(n-N0)*S]})
    assets=ROOT/'map3d/assets';assets.mkdir(exist_ok=True)
    (data/'terrain-mesh.json').write_text(json.dumps({'meshes':meshes,'calibration':calibration},separators=(',',':')),encoding='utf-8')
    (assets/'outlines.json').write_text(json.dumps(outlines,separators=(',',':')),encoding='utf-8')
    (assets/'calibration.json').write_text(json.dumps(calibration,indent=2),encoding='utf-8')
    metadata={'schemaVersion':1,'terrainState':'real-terrain','boundaryId':'JPN-ADM1-47310658','boundaryYear':2017,'boundarySha256':sha(source),'config':CONFIG,'prefectures':meta,'elevationSamplingCounts':counts,'heightRangeMeters':[minh,maxh],'tileCount':len(tiles),'boundaryAreaChangeFraction':abs(area_after-area_before)/area_before,'tilePixelSizeProjectedMeters':PIXEL_METERS,'triangleCount':sum(m['triangles'] for m in meta),'vertexCount':sum(m['vertices'] for m in meta),'coverageNote':'採用した境界データの範囲を表示。境界は2017年の資料に基づき、地形は学習用に簡略化。国境・領有権の判断や測量用途には使いません。','missingDataPolicy':'DEM10Bの当該画素、周囲3画素以内の有効値平均、DEMGMの同手順の順。全て欠損なら生成を停止。海岸付近の補間と低解像度資料への切替は件数を記録。'}
    (assets/'terrain-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    tilemanifest=[{'file':p.name,'sha256':sha(p),'url':f'https://cyberjapandata.gsi.go.jp/xyz/{p.name.split("-")[0]}/{Z}/{p.name.split("-")[2]}/{p.name.split("-")[3]}'} for p in sorted(cache.glob('*.png'))]
    (data/'tile-manifest.json').write_text(json.dumps(tilemanifest,indent=2),encoding='utf-8')
    print(json.dumps({'triangles':metadata['triangleCount'],'vertices':metadata['vertexCount'],'heightRange':metadata['heightRangeMeters'],'samples':counts,'areaChange':metadata['boundaryAreaChangeFraction']}),flush=True)

if __name__=='__main__': main()
