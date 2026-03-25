import * as THREE from 'three';
import { box, plane } from './building-utils.js';

// Pražský metro vagon — cca 19.2m dlouhý, 2.7m široký, 3.5m vysoký
// Inspirace: souprava 81-71M
const DS = THREE.DoubleSide;

// Materials
const bodyMat = new THREE.MeshLambertMaterial({ color: 0xd0d0d0, side: DS }); // stříbrný plášť
const bodyStripe = new THREE.MeshLambertMaterial({ color: 0xcc2200, side: DS }); // červený pruh
const roofMat = new THREE.MeshLambertMaterial({ color: 0x999999, side: DS });
const floorMat = new THREE.MeshLambertMaterial({ color: 0x555555, side: DS });
const doorMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: DS });
const glassMat = new THREE.MeshLambertMaterial({ color: 0x88bbdd, opacity: 0.3, transparent: true, side: DS });
const seatMat = new THREE.MeshLambertMaterial({ color: 0x2255aa, side: DS }); // modré sedačky
const seatFrame = new THREE.MeshLambertMaterial({ color: 0x666666, side: DS });
const railMat = new THREE.MeshLambertMaterial({ color: 0xcccccc, side: DS }); // tyče
const underMat = new THREE.MeshLambertMaterial({ color: 0x333333, side: DS }); // podvozek
const wheelMat = new THREE.MeshLambertMaterial({ color: 0x444444, side: DS });
const interiorWall = new THREE.MeshLambertMaterial({ color: 0xeeeeee, side: DS });
const stripLight = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4, side: DS });
const infoScreen = new THREE.MeshLambertMaterial({ color: 0x00cc66, emissive: 0x00cc66, emissiveIntensity: 0.3, side: DS });
const rubberMat = new THREE.MeshLambertMaterial({ color: 0x222222, side: DS }); // dveřní guma

function p(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// Vagon dimensions
const L = 19.2;   // length (x)
const W = 2.7;    // width (z)
const H = 3.5;    // total height
const FY = 1.1;   // floor Y (above ground — rail height + undercarriage)
const WH = 2.3;   // interior wall height from floor
const TH = 0.08;  // wall thickness

export function createMetroVagon(scene, cx = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);

  buildBody(g);
  buildRoof(g);
  buildFloor(g);
  buildDoors(g);
  buildWindows(g);
  buildInterior(g);
  buildSeats(g);
  buildHandrails(g);
  buildLighting(g);
  buildUndercarriage(g);
  buildBogies(g);

  scene.add(g);
}

// ═══════════════════════════════════════════
// BODY — stříbrný plášť s červeným pruhem
// ═══════════════════════════════════════════
function buildBody(g) {
  const bodyH = H - 0.3; // bez střechy
  const bodyY = FY;

  // Boční stěny — levá (z=0) a pravá (z=W)
  for (const side of [0, W]) {
    // Plné segmenty mezi dveřmi (4 dveře na každé straně)
    // Dveře na pozicích x: 1.5, 5.9, 10.3, 14.7 (šířka 1.4m)
    const doorPositions = [1.5, 5.9, 10.3, 14.7];
    const doorW = 1.4;

    // Segmenty stěny
    const segments = [];
    let lastEnd = 0;
    for (const dx of doorPositions) {
      if (dx > lastEnd) segments.push({ start: lastEnd, end: dx });
      lastEnd = dx + doorW;
    }
    if (lastEnd < L) segments.push({ start: lastEnd, end: L });

    for (const seg of segments) {
      const segW = seg.end - seg.start;
      // Spodní panel (pod okny) — od podlahy do 1.0m
      g.add(p(box(segW, 1.0, TH, bodyMat), seg.start + segW / 2, bodyY + 0.5, side));
      // Horní panel (nad okny) — od 1.9m do stropu
      const topH = bodyH - 1.9;
      g.add(p(box(segW, topH, TH, bodyMat), seg.start + segW / 2, bodyY + 1.9 + topH / 2, side));
      // Červený pruh — 0.1m ve výšce 0.9m od podlahy
      g.add(p(box(segW, 0.1, TH + 0.01, bodyStripe), seg.start + segW / 2, bodyY + 0.95, side));
    }

    // Dveřní sloupky a nadpraží
    for (const dx of doorPositions) {
      // Nadpraží nad dveřmi (dveře 2.0m vysoké)
      const lintelH = bodyH - 2.0;
      g.add(p(box(doorW + 0.1, lintelH, TH, bodyMat), dx + doorW / 2, bodyY + 2.0 + lintelH / 2, side));
    }
  }

  // Čelo a záď
  for (const fx of [0, L]) {
    g.add(p(box(TH, bodyH, W, bodyMat), fx, bodyY + bodyH / 2, W / 2));
    // Čelní okno
    const winW = 1.4, winH = 0.8;
    g.add(p(box(0.01, winH, winW, glassMat), fx + (fx === 0 ? 0.05 : -0.05), bodyY + 1.4, W / 2));
  }
}

// ═══════════════════════════════════════════
// STŘECHA — zaoblená
// ═══════════════════════════════════════════
function buildRoof(g) {
  const roofY = FY + H - 0.3;
  // Plochá střecha s mírným zaoblením (simulováno segmenty)
  const segments = 8;
  const roofW = W;
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const z0 = t0 * roofW;
    const z1 = t1 * roofW;
    const y0 = Math.sin(t0 * Math.PI) * 0.3;
    const y1 = Math.sin(t1 * Math.PI) * 0.3;
    const yAvg = (y0 + y1) / 2;
    const segW = z1 - z0;
    g.add(p(box(L, 0.05, segW, roofMat), L / 2, roofY + yAvg, (z0 + z1) / 2));
  }
}

// ═══════════════════════════════════════════
// PODLAHA
// ═══════════════════════════════════════════
function buildFloor(g) {
  g.add(p(box(L, 0.1, W, floorMat), L / 2, FY, W / 2));
}

// ═══════════════════════════════════════════
// DVEŘE — 4 páry posuvných dveří
// ═══════════════════════════════════════════
function buildDoors(g) {
  const doorPositions = [1.5, 5.9, 10.3, 14.7];
  const doorW = 1.4;
  const doorH = 2.0;

  for (const dx of doorPositions) {
    for (const side of [0, W]) {
      const zOff = side === 0 ? -0.02 : 0.02;
      // Dvě křídla
      const halfW = doorW / 2 - 0.02;
      // Levé křídlo
      g.add(p(box(halfW, doorH, 0.04, doorMat), dx + halfW / 2, FY + doorH / 2, side + zOff));
      // Pravé křídlo
      g.add(p(box(halfW, doorH, 0.04, doorMat), dx + doorW - halfW / 2, FY + doorH / 2, side + zOff));
      // Mezera mezi křídly (gumové těsnění)
      g.add(p(box(0.04, doorH, 0.05, rubberMat), dx + doorW / 2, FY + doorH / 2, side + zOff));
      // Okénko ve dveřích
      const winY = FY + 1.2;
      g.add(p(box(halfW - 0.1, 0.5, 0.01, glassMat), dx + halfW / 2, winY, side + zOff * 2));
      g.add(p(box(halfW - 0.1, 0.5, 0.01, glassMat), dx + doorW - halfW / 2, winY, side + zOff * 2));
    }
  }
}

// ═══════════════════════════════════════════
// OKNA — mezi dveřmi
// ═══════════════════════════════════════════
function buildWindows(g) {
  // Okna v mezerách mezi dveřmi
  const winSections = [
    { start: 3.1, end: 5.7 },   // mezi 1. a 2. dveřmi
    { start: 7.5, end: 10.1 },  // mezi 2. a 3. dveřmi
    { start: 11.9, end: 14.5 }, // mezi 3. a 4. dveřmi
  ];

  const winBottom = FY + 1.0;
  const winH = 0.9;

  for (const sec of winSections) {
    const winW = sec.end - sec.start;
    const cx = (sec.start + sec.end) / 2;
    for (const side of [0, W]) {
      const zOff = side === 0 ? -0.01 : 0.01;
      // Sklo
      g.add(p(box(winW, winH, 0.01, glassMat), cx, winBottom + winH / 2, side + zOff));
    }
  }

  // Malá okna na koncích
  for (const xPos of [0.3, L - 0.3 - 0.8]) {
    for (const side of [0, W]) {
      const zOff = side === 0 ? -0.01 : 0.01;
      g.add(p(box(0.8, 0.7, 0.01, glassMat), xPos + 0.4, winBottom + 0.35, side + zOff));
    }
  }
}

// ═══════════════════════════════════════════
// INTERIÉR — vnitřní stěny, přepážky
// ═══════════════════════════════════════════
function buildInterior(g) {
  // Vnitřní obložení stěn
  const innerY = FY + 0.05;
  const innerH = WH;

  for (const side of [TH, W - TH]) {
    g.add(p(box(L - 0.2, innerH, 0.02, interiorWall), L / 2, innerY + innerH / 2, side));
  }

  // Přepážky u kabiny řidiče
  // Přední
  g.add(p(box(0.05, innerH, W - 0.3, interiorWall), 1.0, innerY + innerH / 2, W / 2));
  // Dveřičky v přepážce (okénko)
  g.add(p(box(0.01, 0.6, 0.5, glassMat), 1.0, innerY + 1.2, W / 2));
}

// ═══════════════════════════════════════════
// SEDAČKY — podélné lavice (typické pro starší metro)
// ═══════════════════════════════════════════
function buildSeats(g) {
  // Sekce sedaček mezi dveřmi
  const seatSections = [
    { start: 3.0, end: 5.7 },
    { start: 7.4, end: 10.1 },
    { start: 11.8, end: 14.5 },
  ];

  const seatH = 0.45;  // výška sedáku
  const seatD = 0.42;  // hloubka
  const seatY = FY + seatH;
  const backH = 0.5;   // opěradlo

  for (const sec of seatSections) {
    const seatW = sec.end - sec.start;
    const cx = (sec.start + sec.end) / 2;

    for (const side of [0, 1]) {
      const sz = side === 0 ? TH + seatD / 2 : W - TH - seatD / 2;

      // Sedák
      g.add(p(box(seatW, 0.06, seatD, seatMat), cx, seatY, sz));
      // Opěradlo
      const backZ = side === 0 ? TH + 0.02 : W - TH - 0.02;
      g.add(p(box(seatW, backH, 0.04, seatMat), cx, seatY + backH / 2, backZ));
      // Noha sedačky (rám)
      g.add(p(box(seatW, seatH - 0.06, 0.03, seatFrame), cx, FY + (seatH - 0.06) / 2 + 0.03, sz));
      // Boční opěrky
      for (const ex of [sec.start + 0.02, sec.end - 0.02]) {
        g.add(p(box(0.04, backH + 0.06, seatD, seatFrame), ex, seatY + backH / 2 - 0.03, sz));
      }
    }
  }

  // Malé sedačky u čela (za přepážkou řidiče)
  const smallSec = { start: 1.2, end: 1.4 + 0.8 };
  for (const side of [0, 1]) {
    const sz = side === 0 ? TH + 0.21 : W - TH - 0.21;
    g.add(p(box(0.8, 0.06, 0.42, seatMat), 1.6, seatY, sz));
    g.add(p(box(0.8, 0.4, 0.04, seatMat), 1.6, seatY + 0.2, side === 0 ? TH + 0.02 : W - TH - 0.02));
  }

  // Zadní konec — sedačky
  for (const side of [0, 1]) {
    const sz = side === 0 ? TH + 0.21 : W - TH - 0.21;
    g.add(p(box(2.0, 0.06, 0.42, seatMat), L - 1.5, seatY, sz));
    g.add(p(box(2.0, 0.4, 0.04, seatMat), L - 1.5, seatY + 0.2, side === 0 ? TH + 0.02 : W - TH - 0.02));
  }
}

// ═══════════════════════════════════════════
// MADLA A TYČE
// ═══════════════════════════════════════════
function buildHandrails(g) {
  const railR = 0.02;
  const railY = FY + 2.0; // výška madla
  const railGeo = new THREE.CylinderGeometry(railR, railR, L - 2.0, 8);

  // Podélné tyče (dvě — u každé strany)
  for (const sz of [0.6, W - 0.6]) {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(L / 2, railY, sz);
    g.add(rail);
  }

  // Svislé tyče u dveří
  const doorPositions = [1.5, 5.9, 10.3, 14.7];
  const doorW = 1.4;
  const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, WH, 8);

  for (const dx of doorPositions) {
    for (const xOff of [0, doorW]) {
      for (const sz of [0.5, W - 0.5]) {
        const pole = new THREE.Mesh(poleGeo, railMat);
        pole.position.set(dx + xOff, FY + WH / 2, sz);
        g.add(pole);
      }
    }
  }

  // Středová tyč u dveří
  for (const dx of doorPositions) {
    const centerPole = new THREE.Mesh(poleGeo, railMat);
    centerPole.position.set(dx + doorW / 2, FY + WH / 2, W / 2);
    g.add(centerPole);
  }
}

// ═══════════════════════════════════════════
// OSVĚTLENÍ — LED pásy na stropě
// ═══════════════════════════════════════════
function buildLighting(g) {
  const lightY = FY + WH - 0.05;

  // Dva LED pásy podél stropu
  for (const sz of [0.5, W - 0.5]) {
    g.add(p(box(L - 2.0, 0.03, 0.15, stripLight), L / 2, lightY, sz));
  }

  // Info displeje nad dveřmi
  const doorPositions = [1.5, 5.9, 10.3, 14.7];
  for (const dx of doorPositions) {
    for (const side of [0, 1]) {
      const sz = side === 0 ? TH + 0.1 : W - TH - 0.1;
      g.add(p(box(0.4, 0.15, 0.03, infoScreen), dx + 0.7, FY + 2.05, sz));
    }
  }
}

// ═══════════════════════════════════════════
// PODVOZEK
// ═══════════════════════════════════════════
function buildUndercarriage(g) {
  // Hlavní rám
  g.add(p(box(L - 1, 0.15, W - 0.4, underMat), L / 2, FY - 0.2, W / 2));

  // Přístrojová skříň
  g.add(p(box(L - 4, 0.4, 1.5, underMat), L / 2, FY - 0.5, W / 2));
}

// ═══════════════════════════════════════════
// PODVOZKY (BOGIES)
// ═══════════════════════════════════════════
function buildBogies(g) {
  const bogiePositions = [3.5, L - 3.5]; // dva podvozky
  const axleSpacing = 2.0;
  const wheelR = 0.42;

  for (const bx of bogiePositions) {
    // Rám podvozku
    g.add(p(box(3.0, 0.2, 2.0, underMat), bx, FY - 0.7, W / 2));

    // Nápravy a kola
    for (const axleOff of [-axleSpacing / 2, axleSpacing / 2]) {
      const ax = bx + axleOff;
      // Náprava
      const axleGeo = new THREE.CylinderGeometry(0.04, 0.04, W + 0.2, 8);
      axleGeo.rotateX(Math.PI / 2);
      const axle = new THREE.Mesh(axleGeo, wheelMat);
      axle.position.set(ax, FY - 0.7 - 0.1, W / 2);
      g.add(axle);

      // Kola (vlnitý profil simulován válcem)
      for (const side of [-0.15, W + 0.15]) {
        const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.1, 16);
        wheelGeo.rotateX(Math.PI / 2);
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(ax, FY - 0.7 - 0.1, side);
        g.add(wheel);

        // Okolek
        const flangeGeo = new THREE.CylinderGeometry(wheelR + 0.03, wheelR + 0.03, 0.03, 16);
        flangeGeo.rotateX(Math.PI / 2);
        const flange = new THREE.Mesh(flangeGeo, wheelMat);
        const flangeZ = side < W / 2 ? side - 0.05 : side + 0.05;
        flange.position.set(ax, FY - 0.7 - 0.1, flangeZ);
        g.add(flange);
      }
    }

    // Odpružení (pružiny)
    for (const sx of [-0.8, 0.8]) {
      for (const sz of [-0.5, 0.5]) {
        const springGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8);
        const spring = new THREE.Mesh(springGeo, railMat);
        spring.position.set(bx + sx, FY - 0.5, W / 2 + sz);
        g.add(spring);
      }
    }
  }

  // Koleje (orientační)
  const railGeo = new THREE.BoxGeometry(L + 4, 0.08, 0.06);
  for (const rz of [-0.15, W + 0.15]) {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(L / 2, FY - 0.7 - 0.1 - wheelR + 0.04, rz);
    g.add(rail);
  }

  // Pražce
  const sleeperCount = Math.floor(L / 0.6);
  for (let i = 0; i < sleeperCount; i++) {
    const sx = i * 0.6 + 0.3;
    g.add(p(box(0.2, 0.06, W + 0.8, underMat), sx, FY - 0.7 - 0.1 - wheelR - 0.01, W / 2));
  }
}
