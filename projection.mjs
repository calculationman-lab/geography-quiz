export const EARTH_RADIUS = 6378137;
export const MAX_LATITUDE = 85.0511287798066;

export function project({latitudeDeg, longitudeDeg} = {}) {
  if (!Number.isFinite(latitudeDeg) || !Number.isFinite(longitudeDeg) ||
      Math.abs(latitudeDeg) > MAX_LATITUDE || Math.abs(longitudeDeg) > 180) {
    throw new RangeError('有効な緯度・経度を指定してください。');
  }
  return {
    east: EARTH_RADIUS * longitudeDeg * Math.PI / 180,
    north: EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + latitudeDeg * Math.PI / 360))
  };
}

export function toWorld(point, config, exaggeration = config.verticalExaggeration) {
  if (!Number.isFinite(point?.heightMeters) || !Number.isFinite(config.metersToWorld) ||
      config.metersToWorld <= 0 || !Number.isFinite(exaggeration) || exaggeration <= 0) {
    throw new RangeError('有効な標高・縮尺・高さ倍率を指定してください。');
  }
  const p = project(point);
  const origin = project({latitudeDeg: config.originLatitudeDeg, longitudeDeg: config.originLongitudeDeg});
  return {x: (p.east-origin.east)*config.metersToWorld,
    y: point.heightMeters*config.metersToWorld*exaggeration,
    z: -(p.north-origin.north)*config.metersToWorld};
}
