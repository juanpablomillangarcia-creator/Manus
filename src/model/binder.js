// ============================================================================
//  DOSIER: exporta la campaña entera a Markdown legible (para leer/imprimir).
//  Resuelve los enlaces a nombres. Es el "cuaderno del Director": incluye
//  secretos y la verdad oculta, marcados como solo-DJ.
// ============================================================================

export function campaignToMarkdown(c) {
  const L = [];
  const p = (s = '') => L.push(s);
  const nmeOf = (id, ...lists) => { for (const l of lists) { const e = (l || []).find((x) => x.id === id); if (e) return e.name; } return null; };
  const names = (ids, ...lists) => (ids || []).map((id) => nmeOf(id, ...lists)).filter(Boolean);
  const all = [c.places, c.factions, c.npcs];
  const secrets = (e) => { const s = (e.secrets || []).filter((x) => x.text); if (!s.length) return; p('  - _Secretos (DJ):_'); s.forEach((x) => p(`    - ${x.text}${x.visibility === 'revealed' ? ' — (revelado)' : ''}`)); };
  const list = (label, arr) => { const a = (arr || []).filter(Boolean); if (a.length) p(`  - _${label}:_ ${a.join('; ')}`); };

  p(`# ${c.name || 'Campaña'}`);
  p(`_${c.archetype || ''}${c.system && c.system !== 'agnostic' ? ' · ' + c.system : ''}${c.scale?.sessions ? ' · ' + c.scale.sessions + ' sesiones' : ''}_`);
  if (c.pitch) { p(''); p(`> ${c.pitch}`); }
  if (c.premise) { p(''); p(c.premise); }
  if ((c.themes || []).length) { p(''); p(`**Temas:** ${c.themes.join(', ')}`); }
  if (c.cosmology) { p(''); p(`**Cosmología:** ${c.cosmology}`); }

  if ((c.timeline || []).length) {
    p('\n## Cronología');
    c.timeline.forEach((e) => {
      p(`- **${e.when ? e.when + ' — ' : ''}${e.title || ''}**`);
      if (e.what) p(`  - ${e.what}`);
      if (e.consequence) p(`  - → ${e.consequence}`);
      const inv = names(e.involvedIds, ...all); if (inv.length) p(`  - _Implica:_ ${inv.join(', ')}`);
    });
  }

  if ((c.places || []).length) {
    p('\n## Mundo');
    const roots = c.places.filter((x) => !x.parentId || !c.places.some((q) => q.id === x.parentId));
    const render = (pl, depth) => {
      p(`${'  '.repeat(depth)}- **${pl.name}**${pl.kind ? ` _(${pl.kind})_` : ''}${pl.hidden ? ' · oculto' : ''}`);
      if (pl.summary) p(`${'  '.repeat(depth)}  - ${pl.summary}`);
      if (pl.government) p(`${'  '.repeat(depth)}  - _Poder:_ ${pl.government}`);
      if (pl.ambience) p(`${'  '.repeat(depth)}  - _Ambiente:_ ${pl.ambience}`);
      list('Puntos de interés', pl.pointsOfInterest); list('Rumores', pl.rumors); list('Peligros', pl.dangers);
      secrets(pl);
      c.places.filter((x) => x.parentId === pl.id).forEach((k) => render(k, depth + 1));
    };
    roots.forEach((r) => render(r, 0));
  }

  if ((c.factions || []).length) {
    p('\n## Facciones');
    c.factions.forEach((f) => {
      p(`- **${f.name}**${f.hidden ? ' · oculto' : ''}`);
      if (f.summary) p(`  - ${f.summary}`);
      if (f.goal) p(`  - _Objetivo:_ ${f.goal}`);
      if (f.resources) p(`  - _Recursos:_ ${f.resources}`);
      if (f.influence) p(`  - _Influencia:_ ${f.influence}`);
      const mem = c.npcs.filter((n) => n.factionId === f.id).map((n) => n.name); if (mem.length) p(`  - _Miembros:_ ${mem.join(', ')}`);
      secrets(f);
    });
  }

  if ((c.npcs || []).length) {
    p('\n## Reparto');
    c.npcs.forEach((n) => {
      p(`- **${n.name}**${n.role ? ` — ${n.role}` : ''}${n.hidden ? ' · oculto' : ''}`);
      if (n.summary) p(`  - ${n.summary}`);
      const where = nmeOf(n.placeId, c.places), fac = nmeOf(n.factionId, c.factions);
      if (where || fac) p(`  - _${[where && 'En ' + where, fac && 'Facción: ' + fac].filter(Boolean).join(' · ')}_`);
      if (n.appearance) p(`  - _Aspecto:_ ${n.appearance}`);
      if (n.goal) p(`  - _Objetivo:_ ${n.goal}`);
      if (n.voice) p(`  - _Voz:_ ${n.voice}`);
      list('Quiere de los PJ', n.wants);
      secrets(n);
    });
  }

  if ((c.bestiary || []).length) {
    p('\n## Bestiario');
    c.bestiary.forEach((t) => {
      p(`- **${t.name}**${t.nature ? ` _(${t.nature})_` : ''}`);
      if (t.description) p(`  - ${t.description}`);
      if (t.tactics) p(`  - _Tácticas:_ ${t.tactics}`);
      if (t.weakness) p(`  - _Debilidad:_ ${t.weakness}`);
      if (t.hook) p(`  - _Gancho:_ ${t.hook}`);
      const inv = names(t.involvedIds, ...all); if (inv.length) p(`  - _Ligado a:_ ${inv.join(', ')}`);
    });
  }

  if ((c.mysteries || []).length) {
    p('\n## Misterios');
    c.mysteries.forEach((m) => {
      p(`- **${m.name}**`);
      if (m.conclusion) p(`  - _Conclusión (DJ):_ ${m.conclusion}`);
      (m.clues || []).forEach((cl) => p(`  - Pista: ${cl.text}${cl.location ? ` _(en ${cl.location})_` : ''}`));
      list('Pistas falsas', m.redHerrings);
    });
  }

  if (c.truth?.core) {
    p('\n## La verdad oculta · SOLO DJ');
    p(c.truth.core);
    if ((c.truth.revelations || []).length) { p('\n**Orden de revelación:**'); c.truth.revelations.forEach((r, i) => p(`${i + 1}. **${r.what}**${r.how ? ` — ${r.how}` : ''}`)); }
    if ((c.truth.foreshadow || []).length) { p('\n**Sembrar pronto:**'); c.truth.foreshadow.forEach((f) => p(`- ${f}`)); }
  }

  if ((c.sessions || []).length) {
    p('\n## Sesiones');
    [...c.sessions].sort((a, b) => (a.number || 0) - (b.number || 0)).forEach((s) => {
      p(`\n### Sesión ${s.number || ''}: ${s.title || ''}`);
      if (s.objective) p(`_Objetivo:_ ${s.objective}`);
      if (s.openingText) { p(''); p(`> ${s.openingText.replace(/\n/g, '\n> ')}`); }
      (s.scenes || []).forEach((sc, i) => {
        const where = nmeOf(sc.placeId, c.places);
        const who = names(sc.npcIds, c.npcs); if (sc.npcNames) who.push(sc.npcNames);
        p(`\n**Escena ${i + 1}: ${sc.title || ''}**${where ? ` _(en ${where})_` : ''}`);
        if (who.length) p(`- _Presentes:_ ${who.join(', ')}`);
        if (sc.beat) p(`- ${sc.beat}`);
        list('Complicaciones', sc.complications);
        if (sc.reveal) p(`- _Puede revelar:_ ${sc.reveal}`);
        if (sc.readAloud) p(`- _Leer:_ "${sc.readAloud}"`);
      });
    });
  }

  if ((c.clocks || []).length) {
    p('\n## Relojes');
    c.clocks.forEach((k) => {
      const fac = names(k.linkedIds, c.factions);
      p(`- **${k.name}** [${k.filled || 0}/${k.segments}]${k.trigger ? ` — dispara: ${k.trigger}` : ''}${fac.length ? ` _(${fac.join(', ')})_` : ''}`);
    });
  }

  if ((c.tables || []).length) {
    p('\n## Tablas de la casa');
    c.tables.forEach((t) => {
      p(`\n**${t.title}**`);
      (t.entries || []).forEach((e, i) => p(`${i + 1}. ${e}`));
    });
  }

  if ((c.chronicle?.chapters || []).length) {
    p('\n## Crónica');
    c.chronicle.chapters.forEach((ch, i) => { p(`\n### Capítulo ${i + 1}: ${ch.title}`); p(''); p(ch.text || ''); });
  }

  p(`\n---\n_Generado con Motor de Campañas._`);
  return L.join('\n');
}
