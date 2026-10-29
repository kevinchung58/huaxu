import { launch, openPage, arrive, aim, park } from "./_aim.mjs";
const b = await launch({ width: 1024, height: 768 });
for (const hour of ["day", "night"]) {
  const p = await openPage(b, { rooms: "street.html", hour, reduce: true });
  for (const stop of [0, 1]) {
    await arrive(p, stop);
    const g = await aim(p, stop === 0 ? 0 : -20);
    if (!g.aimed) continue;
    await park(p);
    await p.screenshot({ path: `.preview/stall/${hour}-stop${stop}-yaw${stop === 0 ? 0 : -20}.png` });
  }
  await p.close();
}
await b.close();
