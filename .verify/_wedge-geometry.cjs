/* Shared geometry for the movement diagnostics. The lane's authored width can widen by depth,
   while blockedAt is the walker's own answer for both props and painted-wall colliders. */
function legalPosition(walk, layer) {
  let segments = [];
  try {
    const value = JSON.parse(layer.getAttribute("data-lane-ws") || "[]");
    if (Array.isArray(value)) segments = value.filter((w) => Array.isArray(w) && w.length >= 3);
  } catch (_) { /* a missing or malformed width list leaves the base lane width */ }
  return (x, z) => {
    if (!Number.isFinite(x) || !Number.isFinite(z) || z < walk.minDepth || z > walk.maxDepth) return false;
    let half = walk.halfWidth;
    for (const w of segments) if (z >= w[0] && z <= w[1]) half = Math.max(half, w[2] - walk.radius);
    return Math.abs(x) <= half && !walk.blockedAt(x, z);
  };
}

// A completed glide is not necessarily an arrival. Check the authored coordinates as well.
function atStop(walk, stop) {
  const z = parseFloat(stop.style.getPropertyValue("--z")) || 0;
  const x = parseFloat(stop.style.getPropertyValue("--x"));
  const distance = Number.isFinite(x) ? Math.hypot(walk.x - x, walk.depth - z) : Math.abs(walk.depth - z);
  return !walk.glide && Number.isFinite(walk.x) && Number.isFinite(walk.depth) && Number.isFinite(distance) && distance <= 6;
}

module.exports = { legalPosition, atStop };
