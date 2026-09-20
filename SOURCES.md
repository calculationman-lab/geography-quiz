# 3D日本地図：資料と加工方法

取得・作成日：2026-09-20。社会マスター v11.2 を基準とした Phase 1。

## 標高

地理院タイル（標高タイル・基盤地図情報数値標高モデル DEM10B）を加工して作成。

- 出典：[国土地理院・地理院タイル一覧](https://maps.gsi.go.jp/development/ichiran.html#dem)
- [PNG標高タイルの仕様](https://maps.gsi.go.jp/development/demtile.html)
- [国土地理院コンテンツ利用規約](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)：公共データ利用規約 PDL1.0、出典と加工の表示。
- URL形式：`https://cyberjapandata.gsi.go.jp/xyz/dem_png/8/{x}/{y}.png`
- 取得時のタイルURL・SHA-256：[tile-manifest.json](./assets/tile-manifest.json)
- 欠損時の予備としてDEMGMも取得したが、今回のモデルでは使用0点。欠損値を黙って標高0として扱わない。DEM10Bの周囲3画素以内の有効値平均で補った海岸付近の点は別集計する。
- ズーム8の画素間隔は投影面上で約611.5m。高解像度の測量モデルではない。平滑化・三角形化によって山頂の標高は原本の最高標高と一致しない。本モデルから地理の数値問題の正解を求めない。

本成果は教育用に地形を概観する内部検証用の簡略モデル。今回、公開サイトへのデプロイは行っていない。[測量成果の利用手続](https://www.gsi.go.jp/LAW/2930-index.html)は出典・利用条件と別に定められている。公開・用途変更時には、その利用方法に対する手続を確認する。

## 都道府県境界

© OpenStreetMap contributors。geoBoundaries / William & Mary geoLabを通じて取得。

- [geoBoundaries JPN ADM1 メタデータ](https://www.geoboundaries.org/api/current/gbOpen/JPN/ADM1/)
- boundaryID：JPN-ADM1-47310658。対象年：2017年。提供元表記：OpenStreetMap, Wambacher。
- 使用版：[commit 9469f09 の簡略GeoJSON](https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/JPN/ADM1/geoBoundaries-JPN-ADM1_simplified.geojson)
- [採用した原本](./assets/prefectures-source.geojson)、[取得時メタデータ](./assets/boundary-api.json)
- [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/)。[OpenStreetMap著作権表示](https://www.openstreetmap.org/copyright)。geoBoundaries一般説明ではなく、この日本データ固有のODbL表記を採用した。

本境界データおよびその派生データ（outlines.json、地方所属を保持した日本地形データ）はODbL 1.0で提供する。改変内容を再現するスクリプトは `tools/map3d/build-terrain.py` と `tools/map3d/export-blender.py`。既存アプリ本体のライセンス・権利を変更するものではない。

47都道府県の安定ID（JP-01〜JP-47）を使い、地方は `regions.json` に定義する。日本地図側の7区分と既存の夏期7地域は別設定。北海道／東北は分離、中国・四国は統合、九州に沖縄を含む。元資料の範囲をそのまま使い、国境・領有権の主張を追加しない。小島は元の位置を保持し、別図への移動は行わない。

## 座標・生成・精度

- 緯度経度：WGS84。投影：EPSG:3857。基準は `config.json` に集約。
- 原点：東経138度、北緯37度。1m＝0.0001ワールド単位。GLBではX東・Y上・Z南。
- Blender内部ではX東・Y北・Z上に置き、glTFのY-up書出し変換を適用する。
- 境界は投影面上150mで形状を簡略化。制約付き三角形分割で海岸・穴を保持し、各頂点に標高を与える。GLBは47都道府県のメッシュを7地方の親にまとめる。
- GLB内の高さ倍率は1。画面のみ8倍／1倍を切り替え、地形と境界を同時に変換する。倍率は画面へ明示する。
- 数学的な投影検査：独立ライブラリpyproj／PROJによる北・中央・南・離島の基準値と0.01m以内で照合。
- GLBの浮動小数点と軸変換：Blender再読込とブラウザーで0.5m以内を判定基準とする。これらは地理資料の実際の精度を表す数値ではない。
- [生成メタデータ](./assets/terrain-metadata.json)に三角形数・画素間隔・境界面積の変化・欠損処理件数を記録。
- 基準式：[PROJ Web Mercator](https://proj.org/en/stable/operations/projections/webmerc.html)

## 表示ライブラリ

Three.js **0.180.0**（r180）、OrbitControls、GLTFLoader、BufferGeometryUtilsを同一パッケージから採用。[MITライセンス](./vendor/THREE-LICENSE.txt)。GLTFLoaderのBufferGeometryUtils参照だけ、同梱配置に合わせて相対パスへ変更。

実行時にCDNへアクセスしない。必要なHTML・CSS・JavaScript・GLB・JSONは同じサイト内から配信する。

- [Three.js公式・導入](https://threejs.org/manual/pages/installation.html)
- [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)

生成環境：Blender 5.2.2 LTS、Python 3.12、numpy、Pillow、shapely 2.1.2、pyproj 3.7.2、triangle 20250106、certifi 2026.7.22。Pythonの生成用パッケージは配布Webアプリの実行には不要。

## Phase 2の地点データ（2026-09-20追加）

places.jsonは5分類・20地点です。国土地理院の公開資料に記載された地図リンクの座標を変更せず取得しました。原資料・取得日・取得ファイルのSHA-256と、地点ごとの出典ID・地図リンクをJSONへ記録しています。学習用の順位・面積・川の長さは今回登録していません。

- 山4地点：[日本の主な山岳](https://maps.gsi.go.jp/3d/mountain/mountain.html)。富士山（剣ヶ峯）、大雪山（旭岳）、大山（剣ヶ峰）、阿蘇山（高岳）。標高も同じ資料の掲載値です。
- 平野4地点：[大地形](https://www.gsi.go.jp/kikaku/tenkei_daichikei.html)の関東・濃尾・越後平野、[九州地方](https://www.gsi.go.jp/kikaku/tenkei_kyushu.html)の筑紫平野東部。
- 川4地点：[北陸地方](https://www.gsi.go.jp/kikaku/tenkei_hokuriku.html)の信濃川小千谷付近、[関東地方](https://www.gsi.go.jp/kikaku/tenkei_kanto.html)の利根川下流、[東北地方](https://www.gsi.go.jp/kikaku/tenkei_tohoku.html)の最上川中流（山形盆地北部）、[四国地方](https://www.gsi.go.jp/kikaku/tenkei_shikoku.html)の四万十川の穿入蛇行。
- 湖4地点：[調査実施湖沼一覧](https://www.gsi.go.jp/kankyochiri/koshouchousa-list.html)の琵琶湖、霞ヶ浦（ここでは西浦）、サロマ湖、猪苗代湖。基準水面は描画補助用の出典値で、現在の水位を保証するものではありません。
- 盆地4地点：東北地方の横手盆地・山形盆地北部、関東地方の甲府盆地東部・松本盆地北部。地方別資料の「関東」は資料の編集区分であり、アプリの地方区分を変更する根拠にはしていません。

[典型地形の注意事項](https://www.gsi.go.jp/kikaku/tenkei_top.html)では位置・範囲が概略で数百mの誤差があり得るとされています。これらの地図リンクの緯度経度をWGS84互換としてPhase 1の共通投影へ渡します。数値計算の精度と元資料の位置精度は異なります。山以外のピンは代表地点で、川全体・平野全域などを示しません。選んだ地点を中心へ寄せるのはカメラだけです。

山形盆地と最上川は同じ出典地点を使います。別の地物なのでIDを分け、位置をずらさず候補一覧から選択します。その他の近いピンも同様で、集約バッジから元の地理位置の根元へ線を表示します。

GLB・都道府県境界・config.json・Blender生成スクリプトはPhase 1から変更していません。独立した地点JSONとJavaScriptを追加した構成です。地点説明は資料をもとに短く書き直したものです。国土地理院資料の出典と加工内容を表示し、既存の境界データのODbL・Three.jsのMITを維持します。今回も公開サイトへのデプロイはしていません。

## Phase 3：ランキング・三大項目（2026-09-20）

| テーマ | 指標・単位・採用精度 | 基準日・資料年 | 対象 |
|---|---|---|---|
| 高い山 3位まで | 標高 / m / 精度 1 | 2026-03-31 | 日本の主な山岳標高一覧に掲載された山の最高地点 |
| 長い川 3位まで | 幹川流路延長 / km / 精度 1 | 2026-09-20閲覧（資料年の記載なし） | 日本の河川。信濃川は千曲川を含む |
| 大きな湖 3位まで | 湖沼面積 / km² / 精度 0.01 | 2026-04-01 | 国土地理院「湖沼面積20傑」の区分（霞ヶ浦は西浦。北浦は別の湖沼として集計） |
| 日本三名園 | 代表セット・順位なし | 2015-12-28更新 | 日本三名園として学ぶ3項目（順不同） |
| 日本三景 | 代表セット・順位なし | 2020-12-15更新 | 日本三景として学ぶ3項目（順不同） |
| 三大都市圏 | 代表セット・順位なし | 2018年地価公示 | 三大都市圏として学ぶ3項目（順不同） |
| 三大工業地帯 | 代表セット・順位なし | 2020年公開資料（2026-09-20閲覧） | 三大工業地帯として学ぶ3項目（順不同） |

- [国土地理院 日本の主な山岳標高](https://www.gsi.go.jp/kihonjohochousa/kihonjohochousa41139.html)：取得 2026-09-20、SHA256 846F6A6D511749036733B36D88EF8FA025F83A3057DA819F67253FF463AFEBF3
- [国土地理院 全国都道府県市区町村別面積調](https://www.gsi.go.jp/KOKUJYOHO/MENCHO-title.htm)：取得 2026-09-20、SHA256 5197D9CAD502E53BFDEB7CF0787A86EDA4DB541D38A610D2FB0B8A3885B53D38
- [国土交通省 千曲川河川事務所 FAQ](https://www.hrr.mlit.go.jp/chikuma/contact/faq.html)：取得 2026-09-20、SHA256 47D4861E3CFC0192F55A57019CA8082624B2258B5EE20376623C5971674302D4
- [茨城県 偕楽園の紹介](https://www.pref.ibaraki.jp/bugai/koho/kenmin/shizenkeikanaki.html)：取得 2026-09-20、SHA256 01BC07BFB18822B48E1859511FBE37006AC20FFB8A259E4E36A61381CCF64797
- [京都府 日本三景天橋立](https://www.pref.kyoto.jp/tango/tango-doboku/hashitate.html)：取得 2026-09-20、SHA256 EDF6A0D4EF500CDCD34F73FA252761FE1495A514EA04CBCD90F028626E746F36
- [国土交通省 用途・圏域等の用語の定義（平成30年地価公示）](https://www.mlit.go.jp/totikensangyo/H30kouji05.html)：取得 2026-09-20、SHA256 E79AADD1D6ABB6115236162A0EF4E14CB4427C8E3C8F54812FB2DF98B8198770
- [四日市市 主な工業地帯・工業地域の中核市等 表5.1.1](https://www.city.yokkaichi.lg.jp/www/contents/1607674272258/simple/503kokuji252.pdf)：取得 2026-09-20、SHA256 B4465230A279D9850157592C9D914CA5626DBF4EB5A7C14698D11C3FC03633A8
- [国土地理院 山岳標高一覧（2026年3月31日版）](https://www.gsi.go.jp/KOKUJYOHO/MOUNTAIN/1003zan20260331.csv)：取得 2026-09-20、SHA256 461F7C5FDDC3D4A947A6ACB3335E5F73E3DFB3E1F0D8A8ACB285E1BCAC2CA8FC
- [国土地理院 面積調（2026年4月1日時点）付2・81頁](https://www.gsi.go.jp/KOKUJYOHO/MENCHO/backnumber/GSI-menseki20260401.pdf)：取得 2026-09-20、SHA256 802A6C092AFE4952AB1CA12F8249BC96A3A14A5CD13BD06A6A2784ACC3E0FAA6

高い山は国土地理院の2026年3月31日版CSV全体の上位を照合。富士山3776m、北岳3193m、奥穂高岳・間ノ岳3190mを採用します。富士山の表示座標はPhase 2から維持し、追加3山の座標は今回のCSVから抽出しています。

湖は2026年4月1日時点の面積調、付2「湖沼面積20傑」（PDF84ページ・本文81頁）を採用。琵琶湖669.22、霞ヶ浦168.20、サロマ湖151.63 km²。霞ヶ浦は西浦として扱い、北浦や外浪逆浦を合算しません。川は千曲川河川事務所FAQの幹川流路延長を採用し、信濃川367、利根川322、石狩川268km。資料年が記載されていないため閲覧日を表示します。

三名園と三景は自治体の紹介資料に記載された組合せです。都市圏は平成30年地価公示の東京圏・名古屋圏・大阪圏という呼称を採用し、首都圏・中京圏・近畿圏の法定境界等とは同一視しません。工業地帯は企画書の学習テーマとして京浜・中京・阪神の3つを扱い、四日市市の資料で名称と代表都市を照合。現在の生産額による上位3地域という意味ではありません。

追加地点は国土地理院の地名検索結果の名称・市区町村コードを照合して選択（石狩川は旭川市付近の地名点）、松島は同院「日本の典型地形」の五大堂のリンクを採用しています。検索レスポンスのSHA256、採用した地点名、座標、コードはcollections.jsonに記録。地名検索は実行時には呼ばず、静的に同梱します。新しい地点も同じ投影設定で配置し、近い画面位置から地方や県を推定しません。

宮島は厳島神社付近、天橋立は地名検索の代表点、松島は五大堂付近。簡略化した海岸メッシュ外の場合は海面0mに配置し、緯度経度は動かしません。都市圏は東京・名古屋・大阪の庁舎、工業地帯は川崎・名古屋・大阪の市役所を代表地点とし、領域の形状や中心点と解釈しません。

数値と地点は学習用の出典付き事実データとして整理し、元資料本文・写真はアプリに転載していません。国土地理院資料は同院の利用規約に従い出典を明記。検証時の元資料ハッシュは更新時の照合に使用します。

## Phase 4：地図クイズ（2026-09-20）

出題する順位・三大項目・元の36地点はPhase 3の採用データを再利用し、既存JSONを変更していません。山の同率3位と日本三名園は正解IDを集合で保持し、集合内の別の地点を誤答に使いません。追加した庭園3地点はクイズの同分類候補としてのみ使用します。

- 栗林公園：香川県公式観光サイト [公園の紹介](https://www.my-kagawa.jp/ritsuringarden/feature/ritsuringarden/garden)。香川県高松市の庭園。
- 小石川後楽園：[東京都公園協会](https://www.tokyo-park.or.jp/park/koishikawakorakuen/)。東京都文京区。日本三名園の岡山の後楽園とは別の庭園。
- 六義園：[東京都公園協会](https://www.tokyo-park.or.jp/park/rikugien/)。東京都文京区の庭園。

座標は国土地理院の地名検索結果から、名称と市区町村コード（栗林公園37201、小石川後楽園・六義園13105）を照合して採用。検索結果の座標を移動せず既存の共通投影へ渡します。庭園全体や精密な園内位置を示すピンではありません。検索は実行時には行いません。

quiz.jsonに各公式資料と地名検索のURL・取得日・SHA256・採用名称・市区町村コード・座標を記録。元ページ本文・写真は転載していません。Phase 1〜3の地形・境界・ライブラリの利用条件と出典表示を維持しています。


## Phase 5：既存問題との関連付け（2026-09-20）

新しい地理数値・座標・庭園・地形を追加せず、Phase 2〜4の出典付き地点・問題を再利用しています。既存questions.js・lower-questions.jsの729問は内容・順序とも維持。対応する31問の問題文・答えを読み、答えの地点か設問に登場した地点かを分類しました。32通りの対応をquestion-links.jsonとQUESTION_LINKS.mdに明示しています。

阿蘇山の問題では高岳を代表地点として使用し、カルデラ全域のピンとは説明しません。霞ヶ浦は従来どおり西浦を使用。瀬田川・千曲川・矢木沢ダム等を直接表示する地点を新設したわけではなく、設問に出てきた琵琶湖・信濃川・利根川の代表地点へ進むことを画面に明示します。名称の類似だけで同じ対象とみなしません。

DB2ファイルの確認時SHA256をquestion-links.jsonへ記録し、単体テストで照合します。実行時は個々の問題ID・文面・正答・出典区分・単元・地域を対応表の確認時情報と照合し、変更された問題の関連付けを停止します。対応のない問題に推測でリンクを付けません。従来の地図出典と利用条件は維持しています。
