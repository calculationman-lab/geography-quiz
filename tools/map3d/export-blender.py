"""blender --background --factory-startup --python export-blender.py -- DATA_DIR"""
import bpy, json, math, pathlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
DATA=pathlib.Path(sys.argv[sys.argv.index('--')+1])
source=json.loads((DATA/'terrain-mesh.json').read_text(encoding='utf-8'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
palette=[(0,(0.31,.57,.45)),(250,(.44,.66,.46)),(700,(.65,.72,.49)),(1400,(.76,.70,.53)),(2400,(.70,.65,.58)),(3500,(.93,.92,.85))]
def color(h):
    for i in range(1,len(palette)):
        if h<=palette[i][0]:
            a,ca=palette[i-1];b,cb=palette[i];f=max(0,min(1,(h-a)/(b-a)))
            return [((1-f)*ca[j]+f*cb[j])**2.2 for j in range(3)]+[1]
    return [c**2.2 for c in palette[-1][1]]+[1]
groups={}
for data in source['meshes']:
    rid=data['regionId']
    if rid not in groups:
        ob=bpy.data.objects.new(rid,None);bpy.context.collection.objects.link(ob);ob['regionId']=rid;groups[rid]=ob
    mesh=bpy.data.meshes.new(data['id']);mesh.from_pydata(data['vertices'],[],data['faces']);mesh.update()
    obj=bpy.data.objects.new(data['id'],mesh);bpy.context.collection.objects.link(obj);obj.parent=groups[rid]
    obj['prefectureId']=data['id'];obj['regionId']=rid;obj['prefectureName']=data['prefecture']
    for poly in mesh.polygons:poly.use_smooth=True
    attr=mesh.color_attributes.new(name='TerrainColor',type='BYTE_COLOR',domain='POINT')
    attr.data.foreach_set('color',[v for h in data['heights'] for v in color(h)])
    mat=bpy.data.materials.new(data['id']+'-terrain');mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.92
    vertex=mat.node_tree.nodes.new('ShaderNodeVertexColor');vertex.layer_name='TerrainColor'
    mat.node_tree.links.new(vertex.outputs['Color'],bsdf.inputs['Base Color']);obj.data.materials.append(mat)
for p in source['calibration']:
    ob=bpy.data.objects.new('calibration-'+p['id'],None);bpy.context.collection.objects.link(ob)
    x,y,z=p['world'];ob.location=(x,-z,y);ob['calibrationId']=p['id']
bpy.ops.wm.save_as_mainfile(filepath=str(DATA/'japan-terrain.blend'))
target=ROOT/'map3d/assets/japan-terrain.glb'
bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',export_yup=True,export_normals=True,export_texcoords=False,export_materials='EXPORT',export_extras=True,export_cameras=False,export_lights=False)
# Independent import catches Blender export-axis and transform mistakes.
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(target))
checks=[]
for p in source['calibration']:
    obj=next(o for o in bpy.context.scene.objects if o.get('calibrationId')==p['id'])
    actual=obj.matrix_world.translation;expected=(p['world'][0],-p['world'][2],p['world'][1])
    error=max(abs(a-b) for a,b in zip(actual,expected))/.0001
    assert error<=.5,(p['id'],error)
    checks.append({'id':p['id'],'roundTripErrorMeters':error})
meshcount=sum(o.type=='MESH' for o in bpy.context.scene.objects)
assert meshcount==47,meshcount
(DATA/'blender-verification.json').write_text(json.dumps({'blenderVersion':bpy.app.version_string,'meshes':meshcount,'glbBytes':target.stat().st_size,'axis':'GLB X east Y up Z south','calibration':checks},indent=2))
print('PHASE1_EXPORT_VERIFIED',target.stat().st_size,flush=True)
