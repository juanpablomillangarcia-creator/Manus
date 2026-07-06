// ============================================================================
//  BANCO DE GENERADORES (procedural, sin API)
//  Variedad por: (1) listas grandes, (2) VARIOS patrones por generador que se
//  rotan, (3) combinatoria. Así no cae siempre en el mismo molde.
// ============================================================================

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const chance = (p) => Math.random() < p;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const contract = (s) => s.replace(/\bde el\b/g, 'del').replace(/\bA el\b/g, 'Al').replace(/\ba el\b/g, 'al');
export const sample = (fn, n = 8) => { const out = []; const seen = new Set(); let g = 0; while (out.length < n && g++ < n * 20) { const v = fn(); if (!seen.has(v)) { seen.add(v); out.push(v); } } return out; };

// ───────────────────────── NOMBRES ─────────────────────────
const SYL = {
  fantasia: { a: ['Ael', 'Bran', 'Cor', 'Dra', 'El', 'Fen', 'Gor', 'Hal', 'Ith', 'Kel', 'Lor', 'Mor', 'Nar', 'Or', 'Pyr', 'Ran', 'Sel', 'Thar', 'Ul', 'Vor', 'Wyn', 'Yr', 'Zan', 'Cael', 'Dorn', 'Esk', 'Fael', 'Gwyn', 'Heth', 'Lyr', 'Myr', 'Riel', 'Syl', 'Tor', 'Vael'], b: ['a', 'e', 'i', 'o', 'u', 'ae', 'ia', 'or', 'en', 'al', 'ir', 'un', 'yth', 'ael', 'wyn', 'eo', 'ae', 'ys'], c: ['ad', 'an', 'ar', 'el', 'eth', 'ia', 'ion', 'is', 'or', 'wyn', 'ric', 'dor', 'las', 'wen', 'mir', 'eus', 'ax', 'oth', 'iel', 'und', 'arn', 'eth'] },
  nordico: { a: ['Bjor', 'Sig', 'Ulf', 'Rag', 'Thor', 'Hak', 'Ein', 'Leif', 'Sven', 'Gun', 'Hel', 'Ast', 'Fre', 'Yng', 'Hrol', 'Bald', 'Erik', 'Sten', 'Vid', 'Orm', 'Hild', 'Sol', 'Run'], b: ['n', 'va', 'mu', 'da', 'gi', 'ke', 'bjo', 'va', 'ri', 'al', 'un', 'ge'], c: ['nar', 'rik', 'son', 'dis', 'hild', 'grim', 'bjorn', 'gard', 'finn', 'vald', 'run', 'mund', 'ulf', 'veig', 'gunn', 'thra'] },
  elfico: { a: ['Ae', 'Cae', 'Ela', 'Fae', 'Gala', 'Ily', 'Lae', 'Mira', 'Nae', 'Sera', 'Thae', 'Va', 'Ya', 'Aer', 'Cele', 'Eli', 'Fin', 'Lho', 'Nim', 'Sil', 'Tha', 'Vela'], b: ['la', 'ri', 'wen', 'na', 'lia', 'ru', 'the', 'me', 'si', 'ae', 'lo', 'phi'], c: ['dil', 'rion', 'thas', 'wen', 'mira', 'las', 'nor', 'viel', 'reth', 'wyn', 'ndir', 'thalas', 'riel', 'dae', 'loth', 'mil'] },
  enano: { a: ['Bal', 'Dur', 'Gim', 'Thra', 'Brok', 'Korg', 'Dwa', 'Throm', 'Baz', 'Grun', 'Khaz', 'Mor', 'Dain', 'Nor', 'Bof', 'Thol', 'Gar', 'Ula', 'Vond'], b: ['in', 'ar', 'um', 'ok', 'gar', 'din', 'a', 'or', 'un', 'ric'], c: ['din', 'grim', 'bek', 'dur', 'lin', 'rak', 'mund', 'gar', 'nar', 'dottir', 'thane', 'fist', 'helm', 'forge'] },
  orco: { a: ['Gru', 'Maz', 'Throk', 'Urz', 'Gor', 'Bru', 'Snag', 'Kru', 'Dro', 'Vra', 'Nok', 'Gha', 'Ush', 'Krag', 'Mog', 'Zul', 'Hru', 'Bol'], b: ['g', 'ash', 'um', 'ka', 'or', 'na', 'uk', 'za'], c: ['mash', 'nak', 'gor', 'durz', 'buk', 'rag', 'thar', 'gul', 'zog', 'grish', 'lok', 'mog', 'snag'] },
  costero: { a: ['Mar', 'Sal', 'Cor', 'Vel', 'Bra', 'Cas', 'Lu', 'Ria', 'Tor', 'Ner', 'Bal', 'Sera', 'Mira', 'Cala', 'Vega', 'Pere', 'Suri', 'Tala'], b: ['a', 'e', 'i', 'va', 'da', 'ro', 'li', 'mar', 'no'], c: ['no', 'na', 'lo', 'res', 'mar', 'da', 'via', 'sol', 'lén', 'rio', 'nde', 'lla', 'zo'] },
  imperial: { a: ['Aur', 'Cass', 'Dec', 'Fab', 'Gai', 'Hor', 'Luc', 'Mar', 'Oct', 'Quin', 'Sev', 'Tib', 'Val', 'Vit', 'Corn', 'Iul', 'Liv', 'Prisc'], b: ['i', 'e', 'an', 'il', 'er', 'or', 'in'], c: ['ius', 'us', 'anus', 'ilus', 'inus', 'ax', 'ian', 'entus', 'or', 'ina', 'illa', 'enna'] },
  desertico: { a: ['Al', 'Ha', 'Ka', 'Na', 'Ra', 'Sa', 'Ta', 'Za', 'Bil', 'Far', 'Jal', 'Mus', 'Qa', 'Yu', 'Sha', 'Dar'], b: ['ru', 'ma', 'di', 'la', 'sa', 'ya', 'wa', 'ji', 'na'], c: ['din', 'mar', 'sad', 'lim', 'rah', 'zad', 'mir', 'wan', 'bah', 'reth', 'sul', 'qan'] },
  oriental: { a: ['Aki', 'Hae', 'Jin', 'Kae', 'Li', 'Mei', 'Ren', 'Sho', 'Tae', 'Yun', 'Bao', 'Fen', 'Hyo', 'Ling', 'Rui', 'Xia'], b: ['', 'no', 'shi', 'wa', 'ko', 'ru', 'mi', 'jin'], c: ['na', 'to', 'ren', 'lin', 'jun', 'mei', 'ko', 'hiro', 'long', 'yan', 'shu'] },
};
export const CULTURES = [['fantasia', 'Fantasía'], ['nordico', 'Nórdico'], ['elfico', 'Élfico'], ['enano', 'Enano'], ['orco', 'Orco'], ['costero', 'Costero'], ['imperial', 'Imperial'], ['desertico', 'Desértico'], ['oriental', 'Oriental']];

const EPITHETS = ['el Tuerto', 'la Sabia', 'Mano de Hierro', 'el Sin Nombre', 'la Roja', 'el Errante', 'Corazón de Roble', 'el Carnicero', 'la Muda', 'el Viejo', 'Puño de Piedra', 'la Zorra', 'el Cuervo', 'Lengua de Plata', 'el Manco', 'la Pálida', 'Ojo de Halcón', 'el Justo', 'la Implacable', 'Tres Dedos', 'el Cojo', 'la Tejedora', 'Sangre Fría', 'el Quemado', 'la Sin Sombra', 'el Hambriento', 'Paso Quedo', 'la Tuerta', 'el Sabueso', 'la Loba'];

function genBase(culture) {
  const s = SYL[culture] || SYL.fantasia;
  let n = rand(s.a);
  if (chance(0.55)) n += rand(s.b);
  n += rand(s.c);
  return cap(n.replace(/(.)\1\1/g, '$1$1'));
}
export function genName(culture = 'fantasia') {
  const base = genBase(culture);
  const r = Math.random();
  if (r < 0.60) return base;
  if (r < 0.78) return `${base} ${rand(EPITHETS)}`;
  if (r < 0.90) return `${base} de ${genTown()}`;
  if (culture === 'nordico' || culture === 'enano') return `${base}, ${rand(['hijo', 'hija'])} de ${genBase(culture)}`;
  return `${base} ${rand(EPITHETS)}`;
}

// ───────────────────────── LUGARES ─────────────────────────
const T_PRE = ['Cuervo', 'Piedra', 'Espina', 'Ceniza', 'Niebla', 'Roble', 'Sauce', 'Hierro', 'Sal', 'Oro', 'Sombra', 'Helada', 'Roca', 'Lobo', 'Zarza', 'Bruma', 'Negro', 'Viejo', 'Alto', 'Bajo', 'Cardo', 'Fresno', 'Cuerno', 'Garza', 'Junco', 'Liebre', 'Musgo', 'Pino', 'Rana', 'Tejo', 'Urraca', 'Aliso', 'Brezo', 'Encina'];
const T_SUF = ['vado', 'puente', 'foso', 'cima', 'valle', 'puerto', 'colina', 'risco', 'hondo', 'remanso', 'guardia', 'muro', 'campo', 'prado', 'ribera', 'otero', 'umbral', 'confín', 'cruce', 'soto', 'llano', 'altar', 'torre', 'fragua', 'pozo'];
const T_HEAD = ['Vado', 'Puerto', 'Fuerte', 'Villa', 'Monte', 'Valle', 'Paso', 'Torre', 'Puente', 'Cruce', 'Refugio', 'Alcázar', 'Ribera', 'Otero', 'Collado', 'Ermita', 'Aldea', 'Castillo', 'Posada', 'Mina', 'Foso'];
const T_MOD = ['las Gaviotas', 'el Cuervo', 'los Tres Robles', 'la Bruma', 'las Ánimas', 'el Ahorcado', 'los Lobos', 'la Sal', 'el Rey Muerto', 'las Brujas', 'el Eco', 'los Espejos', 'la Serpiente', 'el Olvido', 'los Suspiros', 'la Ceniza', 'el Trueno', 'las Lágrimas', 'el Vigía', 'los Cuernos', 'la Daga', 'el Invierno'];
const T_SINGLE = ['Grismar', 'Valdoria', 'Korhaven', 'Nethermoor', 'Pendragón', 'Albacara', 'Verecruz', 'Solmuro', 'Caldera', 'Vendaval', 'Carcosa', 'Belmoira', 'Travesura', 'Espéculo', 'Yermo', 'Brumaria', 'Cendral', 'Velorio', 'Argenta', 'Umbría'];
const T_PLURAL = ['Tres Torres', 'Espejos', 'Ánimas', 'Cuervos', 'Robles Quemados', 'Hermanas', 'Vigías', 'Pozos', 'Cuernos', 'Lágrimas', 'Ahorcados', 'Centinelas'];
export function genTown() { return contract(_genTown()); }
function _genTown() {
  const r = Math.random();
  if (r < 0.32) return `${rand(T_PRE)}${rand(T_SUF)}`;
  if (r < 0.58) return `${rand(T_HEAD)} de ${rand(T_MOD)}`;
  if (r < 0.74) return rand(T_SINGLE);
  if (r < 0.87) return `${rand(['Las', 'Los'])} ${rand(T_PLURAL)}`;
  return `${rand(['San', 'Santa', 'Puerto', 'Fuerte', 'Villa', 'Monte'])} ${genBase('fantasia')}`;
}

const R_KIND = ['Río', 'Arroyo', 'Caudal', 'Corriente', 'Vado', 'Garganta', 'Brazo'];
const R_NAME = ['Serpiente', 'Plata', 'Lágrima', 'Hondo', 'Negro', 'Sauce', 'Viento', 'Bruma', 'Ámbar', 'Aguja', 'Eco', 'Sangre', 'Espejo', 'Sirena', 'Trucha', 'Vidrio', 'Ceniza', 'Anguila', 'Sal'];
const R_MOD = ['los Ahogados', 'las Truchas', 'la Bruma', 'los Sauces', 'la Doncella', 'los Cantos', 'la Niebla', 'los Juncos', 'el Lamento', 'las Garzas'];
export function genRiver() { return contract(_genRiver()); }
function _genRiver() {
  const r = Math.random();
  if (r < 0.5) return `${rand(R_KIND)} ${rand(R_NAME)}`;
  if (r < 0.82) return `${rand(R_KIND)} de ${rand(R_MOD)}`;
  return `el ${rand(R_NAME)}`;
}

// ───────────────────────── TABERNAS ─────────────────────────
const TAV_ADJ = ['Dorado', 'Oxidado', 'Borracho', 'Errante', 'Silencioso', 'Roto', 'Risueño', 'Sangriento', 'Perdido', 'Tuerto', 'Cojo', 'Hambriento', 'Ahogado', 'Negro', 'Manchado', 'Jovial', 'Torcido', 'Solitario', 'Afortunado', 'Lloroso'];
const TAV_N = [['Dragón', 'm'], ['Jabalí', 'm'], ['Grifo', 'm'], ['Ancla', 'f'], ['Daga', 'f'], ['Corona', 'f'], ['Sirena', 'f'], ['Cuervo', 'm'], ['Yelmo', 'm'], ['Toro', 'm'], ['Unicornio', 'm'], ['Barril', 'm'], ['Farol', 'm'], ['Lobo', 'm'], ['Caballo', 'm'], ['Zorra', 'f'], ['Rosa', 'f'], ['Cabra', 'f'], ['Cuerno', 'm'], ['Remo', 'm'], ['Herradura', 'f'], ['Gallo', 'm']];
const inflect = (adj, g) => (g === 'f' && adj.endsWith('o')) ? adj.slice(0, -1) + 'a' : adj;
export function genTavern() { return contract(_genTavern()); }
function _genTavern() {
  const [n, g] = rand(TAV_N);
  const art = g === 'f' ? 'La' : 'El';
  const r = Math.random();
  if (r < 0.45) return `${art} ${n} ${inflect(rand(TAV_ADJ), g)}`;
  if (r < 0.68) return `La Posada del ${rand(TAV_N.filter(([, gg]) => gg === 'm'))[0] || n}`;
  if (r < 0.85) { const [n2, g2] = rand(TAV_N); return `${art} ${n} y ${g2 === 'f' ? 'la' : 'el'} ${n2}`; }
  return `A ${g === 'f' ? 'la' : 'el'} ${n} ${inflect(rand(TAV_ADJ), g)}`;
}

// ───────────────────────── BARATIJAS ─────────────────────────
const TRINKETS = ['un dado de hueso que siempre cae en 1', 'una llave oxidada sin cerradura conocida', 'un retrato de alguien que nadie reconoce', 'un anillo que enfría al mentir', 'una moneda de un reino caído', 'un dedal de plata con runas', 'un mechón de pelo atado con hilo rojo', 'un mapa de un lugar que ya no existe', 'una vela que arde en azul', 'un diente que aún duele al frío', 'una caja musical sin manivela', 'un guante demasiado grande para cualquier mano', 'una pluma que escribe sola palabras a medias', 'un frasco con una tormenta diminuta dentro', 'una brújula que señala a casa', 'un ojo de cristal que parpadea al anochecer', 'una carta sellada con tu propio nombre', 'una campanilla muda', 'un hueso que tararea cerca del agua', 'una semilla que late como un corazón', 'un espejo que tarda un instante de más en reflejarte', 'una baraja a la que le falta siempre la misma carta', 'un silbato que solo oyen los perros muertos', 'un anillo grabado con una fecha futura', 'un trozo de cuerda que nunca se deshace', 'una muñeca de trapo con tu cara', 'un reloj de arena con arena negra que sube', 'un botón de un uniforme de un ejército inexistente', 'una concha que repite la última palabra que oyó', 'un farolillo que solo prende en cementerios', 'una herradura que zumba cerca del hierro robado', 'un peine de marfil con un cabello que no es tuyo', 'una moneda con dos cruces y ninguna cara', 'un mapa estelar de un cielo equivocado', 'una cucharilla que amarga la miel', 'un guante con seis dedos', 'una llave de hielo que no se derrite', 'un libro en blanco que pesa como si estuviera lleno', 'un anzuelo que solo pesca cosas perdidas', 'una máscara que sonríe cuando tú no'];
export const genTrinket = () => rand(TRINKETS);

// ───────────────────────── RUMORES ─────────────────────────
const RUMOR_T = [
  () => `Dicen que en ${genTown()} no ha llovido desde que el alcalde desapareció.`,
  () => `Un viajero jura que ${genRiver().toLowerCase()} arrastró anoche algo que pedía auxilio.`,
  () => `En ${genTavern()} pagan en oro por no hacer preguntas.`,
  () => `Aseguran que ${genName(rand(['fantasia', 'nordico', 'elfico']))} volvió de entre los muertos... cambiado.`,
  () => `Nadie que entra de noche en ${genTown()} sale antes del alba.`,
  () => `Se rumorea que bajo ${genTown()} hay puertas que solo abren con un nombre verdadero.`,
  () => `Los niños de ${genTown()} cantan una canción sobre algo que duerme en el pozo.`,
  () => `Cuentan que ${genName('costero')} pagó su deuda con algo que no era oro.`,
  () => `El precio del pan ha subido en ${genTown()}; dicen que la culpa es de lo que vive en la mina.`,
  () => `Una caravana entera desapareció en el camino a ${genTown()}, y solo volvieron los caballos.`,
  () => `Juran que en ${genTavern()} sirven un vino que te hace recordar vidas que no viviste.`,
  () => `Desde ${genTown()} llegan menos cartas cada mes... y las que llegan están escritas con otra letra.`,
  () => `Dicen que ${genName('imperial')} ofrece tierras a quien le traiga la cabeza de cierta bestia.`,
  () => `En ${genTown()} entierran a sus muertos boca abajo, y nadie quiere explicar por qué.`,
];
export const genRumor = () => rand(RUMOR_T)();

// ───────────────────────── NPC RÁPIDO ─────────────────────────
const OCCUP = ['herrero', 'posadero', 'contrabandista', 'sacerdotisa', 'cazarrecompensas', 'boticario', 'escriba', 'guardia retirado', 'partera', 'enterrador', 'prestamista', 'juglar', 'curtidor', 'cartógrafa', 'alquimista', 'pescadora', 'ladrón de tumbas', 'cocinera', 'mercenaria', 'molinero', 'vidente', 'verdugo', 'domadora de bestias', 'embalsamador'];
const TRAIT = ['tartamudea cuando miente', 'no parpadea casi nunca', 'huele siempre a clavo y humo', 'colecciona dientes', 'ríe en los momentos malos', 'habla con su mula como con un viejo amigo', 'tiene una cicatriz que cambia de sitio', 'jamás se quita los guantes', 'cuenta el dinero tres veces', 'mira por encima del hombro cada pocas frases', 'tiene un ojo de distinto color', 'reza a un dios que ya nadie venera', 'come solo de pie', 'lleva luto por alguien vivo', 'nunca dice su verdadero nombre'];
const QUIRK = ['debe un favor que no quiere pagar', 'esconde un origen noble', 'busca a un hermano desaparecido', 'envenena lentamente a alguien por venganza', 'sabe dónde está enterrado un tesoro... y miente', 'trabaja para dos bandos a la vez', 'maldice cada luna llena', 'guarda una carta que podría hundir a la ciudad', 'cambió de cara hace años y reza por que no lo reconozcan', 'protege a un monstruo al que considera familia'];
export const genNPC = () => `${genName(rand(['fantasia', 'costero', 'nordico', 'imperial']))}, ${rand(OCCUP)}. ${cap(rand(TRAIT))}; ${rand(QUIRK)}.`;

// ───────────────────────── RASGOS / VOZ / MOTIVOS ─────────────────────────
export const genTrait = () => cap(rand(TRAIT));
const MOTIV = ['saldar una deuda de sangre', 'proteger a alguien que no lo merece', 'recuperar algo robado hace mucho', 'demostrar que se equivocaron con él', 'huir de un pasado que lo persigue', 'comprar su libertad', 'vengar a quien nadie recuerda', 'encontrar una cura imposible', 'cumplir una promesa hecha a un muerto', 'ascender sin importar el precio', 'ocultar un crimen', 'reunir a una familia rota'];
export const genMotivation = () => cap(rand(MOTIV));
const VOICE = ['susurra como si compartiera un secreto', 'habla a gritos aunque estés al lado', 'mezcla palabras de tres idiomas', 'termina cada frase con una pregunta', 'usa refranes inventados', 'habla en tercera persona de sí mismo', 'hace pausas larguísimas y eternas', 'tutea a reyes y mendigos por igual', 'jura por dioses cada vez más raros', 'repite tu última palabra antes de responder'];
export const genVoice = () => cap(rand(VOICE));

// ───────────────────────── GANCHOS ─────────────────────────
const HOOK_T = [
  () => `Una carta sin firma ofrece ${rand(['una fortuna', 'un perdón real', 'un mapa', 'una verdad peligrosa'])} a cambio de robar ${rand(['una reliquia', 'un cadáver', 'un libro prohibido', 'a un niño'])} de ${genTown()}.`,
  () => `${cap(genName('imperial'))} ha desaparecido camino de ${genTown()}, y quien lo buscó antes no ha vuelto.`,
  () => `Algo profana las tumbas de ${genTown()}; alguien que dice ser ${rand(OCCUP)} ofrece oro y no quiere que intervenga la guardia.`,
  () => `Dos facciones se disputan ${rand(['un puente', 'una mina', 'un pozo', 'un templo'])} en ${genTown()}, y ambas os quieren de su lado.`,
  () => `Alguien que trabaja de ${rand(OCCUP)} jura que ${rand(['su hija', 'su socio', 'el alcalde'])} fue sustituido por ${rand(['un impostor', 'algo que no es humano'])}.`,
  () => `${genTavern()} arde la misma noche que llegáis, y entre las cenizas hay un cuerpo que no debería estar ahí.`,
];
export const genHook = () => rand(HOOK_T)();

// ───────────────────────── BOTÍN / OBJETO MÁGICO ─────────────────────────
const LOOT_MAT = ['de plata ennegrecida', 'de hueso pulido', 'de bronce verdoso', 'de obsidiana', 'de marfil agrietado', 'de hierro frío', 'de jade', 'de madera petrificada', 'de oro mate', 'de cristal de sal'];
const LOOT_OBJ = ['un anillo', 'un colgante', 'una daga', 'un cáliz', 'una máscara', 'un brazalete', 'una corona', 'un cuerno', 'un espejo de mano', 'una llave', 'un broche', 'un ídolo'];
const LOOT_FEAT = ['grabado con un nombre tachado', 'que susurra al acercarse a la sangre', 'tibio aunque haga frío', 'que pesa según quién lo sostenga', 'con una gema que late despacio', 'cubierto de una escritura que cambia', 'que apaga las velas cercanas', 'marcado con el sello de una casa caída'];
export const genLoot = () => `${cap(rand(LOOT_OBJ))} ${rand(LOOT_MAT)}, ${rand(LOOT_FEAT)}.`;

const MAGIC_EFF = ['una vez al día convierte el miedo en valor durante un latido', 'muestra la última mentira que oíste, escrita en el aire', 'guarda una sola palabra y la repite cuando la tocas', 'señala hacia lo que más temes', 'cura una herida a cambio de un recuerdo', 'te deja ver en la oscuridad mientras contienes la respiración', 'enciende una llama fría que no quema pero alumbra a los muertos', 'hace que una cerradura te confiese cómo abrirla'];
export const genMagicItem = () => `${cap(rand(LOOT_OBJ))} ${rand(LOOT_MAT)}: ${rand(MAGIC_EFF)}.`;

// ───────────────────────── CLIMA / AMBIENTE ─────────────────────────
const WEATHER = ['un cielo plomizo que no acaba de descargar', 'niebla que se levanta a la altura de las rodillas', 'un viento que trae olor a sal y a algo podrido', 'llovizna fina y constante que cala los huesos', 'un calor seco que hace temblar el horizonte', 'escarcha temprana sobre todo lo que toca la sombra', 'un cielo demasiado claro para la estación', 'truenos lejanos sin una sola nube', 'una calma absoluta en la que no canta ningún pájaro'];
export const genWeather = () => cap(rand(WEATHER));
const AMBI = ['huele a cera derretida y a moho', 'el suelo cruje como si pisaras hielo fino', 'hay un zumbido grave que no proviene de ningún sitio', 'el aire sabe a cobre', 'todo está cubierto de un polvo que no se posa', 'las sombras parecen ir un instante por detrás', 'se oye gotear agua que nunca encuentras', 'hace más frío junto a las paredes que en el centro', 'una corriente apaga las velas de una en una'];
export const genAmbience = () => cap(rand(AMBI));

// ───────────────────────── TABLAS DE EVENTOS ─────────────────────────
export const TABLES = {
  viaje: ['Una caravana herida pide ayuda... o tiende una trampa.', 'El clima vira de golpe: tormenta inminente.', 'Restos de un campamento reciente, aún caliente la ceniza.', 'Un puente vital está roto o vigilado.', 'Rastro de una bestia grande cruzando el camino.', 'Un peregrino solitario con noticias inquietantes.', 'Un hito antiguo marca un desvío olvidado.', 'Cuervos en círculo sobre algo más adelante.', 'Un mercader varado ofrece un trato dudoso.', 'El camino se bifurca donde el mapa dice que no.', 'Una procesión fúnebre os corta el paso.', 'Animales huyendo en dirección contraria.'],
  ciudad: ['Una persecución a plena calle estalla cerca.', 'Un pregonero anuncia un edicto que os afecta.', 'Un carterista marca a uno del grupo.', 'Una reyerta de gremios bloquea la plaza.', 'Alguien os confunde con otra persona... peligrosa.', 'Un mercader ofrece algo demasiado bueno.', 'La guardia hace una redada selectiva.', 'Un rostro del pasado os reconoce.', 'Un mendigo os susurra un aviso y huye.', 'Cierran las puertas de la ciudad antes de tiempo.', 'Un cadáver aparece justo donde estabais.', 'Una fiesta os arrastra y os retrasa.'],
  mazmorra: ['Una corriente de aire delata un pasaje oculto.', 'Marcas de garras frescas en la piedra.', 'Un charco que no refleja lo que debería.', 'Ecos de pasos que no son los vuestros.', 'Una trampa ya disparada... ¿por quién?', 'Inscripciones que avisan en una lengua muerta.', 'Algo arrastró un cuerpo por aquí, hace poco.', 'Una sala sellada desde dentro.', 'Hongos que brillan donde alguien murió.', 'Una puerta que recuerda haber estado en otro muro.', 'Provisiones recientes de un grupo que ya no está.', 'Un susurro repite tu nombre desde la oscuridad.'],
  bosque: ['Un claro perfecto donde no canta nada.', 'Árboles marcados con un símbolo reciente.', 'Un puente de cuerda sobre un barranco demasiado hondo.', 'Una choza con la chimenea humeando y la puerta abierta.', 'Huesos colgados de las ramas como campanillas.', 'Un sendero de setas que no estaba ayer.', 'Una niña perdida... o algo que lo finge.', 'El bosque se cierra detrás de vosotros.'],
  mar: ['Velas en el horizonte que no responden a señales.', 'Calma chicha y una niebla que no se mueve.', 'Restos de un naufragio reciente con un superviviente.', 'Algo enorme pasa bajo el casco.', 'Una isla que no aparece en ninguna carta.', 'El agua cambia de color y huele a tumba.', 'Un canto lejano que pone nerviosa a la tripulación.', 'Faro encendido en una costa deshabitada.'],
  clima: ['Tormenta eléctrica sin lluvia.', 'Niebla que se levanta de pronto y aísla al grupo.', 'Una helada fuera de temporada mata el camino.', 'Calor asfixiante que obliga a viajar de noche.', 'Granizo del tamaño de un puño.', 'Un cielo rojo que asusta a los animales.', 'Lluvia constante que crece los ríos.', 'Viento huracanado que arranca tiendas y tejados.'],
};
export const TABLE_KEYS = Object.keys(TABLES);
export const rollTable = (key) => rand(TABLES[key] || []);

// ───────────────────────── FACCIONES / CULTOS ─────────────────────────
const FAC_HEAD = ['La Orden', 'El Círculo', 'La Cofradía', 'La Hermandad', 'El Culto', 'La Mano', 'Los Hijos', 'Las Hijas', 'La Casa', 'El Sínodo', 'La Logia', 'Los Guardianes', 'La Compañía', 'Los Herederos', 'La Congregación', 'El Gremio'];
const FAC_OF = ['del Ojo Quebrado', 'de la Marea Negra', 'del Silencio', 'de la Llama Fría', 'del Gusano', 'de las Siete Llaves', 'de la Ceniza', 'del Umbral', 'de la Sal', 'de la Espina', 'del Abismo', 'de la Luna Rota', 'de los Ahogados', 'del Trono Vacío', 'de la Cicatriz', 'del Cuervo Blanco', 'de la Verdad Amarga', 'de la Última Puerta', 'de la Carne y el Verbo'];
const FAC_ADJ = ['Escarlata', 'Ciega', 'Sumergida', 'Callada', 'Rota', 'Errante', 'Púrpura', 'Cenicienta', 'Velada', 'Insomne', 'Blanca', 'Amarga'];
const FAC_HEAD_F = ['La Orden', 'La Cofradía', 'La Hermandad', 'La Casa', 'La Logia', 'La Compañía', 'La Congregación', 'La Mano'];
const FAC_HEAD_PL = ['Los Hijos', 'Las Hijas', 'Los Herederos', 'Los Guardianes'];
export function genFaction() {
  const r = Math.random();
  if (r < 0.55) return `${rand(FAC_HEAD)} ${rand(FAC_OF)}`;            // cualquier cabecera + "de…"
  if (r < 0.82) return `${rand(FAC_HEAD_F)} ${rand(FAC_ADJ)}`;         // cabecera femenina + adj femenino
  return `${rand(FAC_HEAD_PL)} ${rand(FAC_OF)}`;                       // plural + "de…"
}

// ───────────────────────── DEIDADES / ENTIDADES ─────────────────────────
const DEI_NAME = ['Yoggur', 'Nyarla', 'Xothra', 'Ubbo', 'Cthaat', 'Zhar', 'Ythog', 'Aphoom', 'Rhan-Tegoth', 'Vhuzoth', 'Ossadros', 'Mnomquah', 'Tsathog', 'Yhoundé', 'Kaalut', 'Sethra'];
const DEI_EP = ['el que Sueña bajo la Sal', 'la Boca de la Noche', 'el Rey de Astillas', 'la que Cuenta los Días', 'el Hambre sin Forma', 'el Testigo Ciego', 'la Marea que Recuerda', 'el Nudo de Estrellas', 'la Madre de Ecos', 'el que Aguarda tras la Puerta', 'la Sombra de Mil Ojos', 'el Verbo Ahogado'];
export const genDeity = () => `${rand(DEI_NAME)}, ${rand(DEI_EP)}`;

// ───────────────────────── ARTEFACTOS CON NOMBRE ─────────────────────────
const ART_OBJ = ['la Corona', 'el Cáliz', 'la Llave', 'el Códice', 'la Máscara', 'el Espejo', 'la Daga', 'el Anillo', 'el Cetro', 'la Campana', 'el Ojo', 'la Lámpara', 'el Sudario', 'el Yelmo', 'la Lira', 'el Reloj'];
const ART_OF = ['de las Mareas', 'de Ceniza', 'del Rey Ahogado', 'de los Nombres', 'del Sueño Largo', 'sin Reflejo', 'de la Hora Undécima', 'de Vhuzoth', 'de la Carne Muda', 'de los Siete Sellos', 'del Primer Invierno', 'que Susurra', 'de la Deuda', 'del Umbral'];
export const genArtifact = () => contract(`${rand(ART_OBJ)} ${rand(ART_OF)}`);

// ───────────────────────── PRESAGIOS ─────────────────────────
const OMEN = ['Los perros del pueblo aullaron toda la noche a la misma estrella.', 'El agua de los pozos sabe a hierro desde el martes.', 'Nacieron tres corderos con el mismo lunar en el ojo.', 'Las campanas sonaron solas a la hora tercera.', 'Los pájaros vuelan en círculos y no se posan.', 'Una niña dibujó un símbolo que nadie le enseñó.', 'La leche se agria antes del mediodía.', 'Las sombras caen un palmo más largas de lo debido.', 'Un hombre soñó su muerte y amaneció con la marca.', 'El río bajó rojo un solo día y volvió a su color.', 'Los espejos de la casa amanecieron cubiertos de escarcha por dentro.', 'Nadie recuerda ya el nombre del que vivía en la casa del final.'];
export const genOmen = () => rand(OMEN);

// ───────────────────────── COMPLICACIONES / GIROS ─────────────────────────
const COMPL = ['Justo cuando parece resuelto, un testigo lo cambia todo.', 'El aliado trabajaba para el otro bando desde el principio.', 'La prueba clave se destruye ante sus ojos.', 'Alguien a quien salvaron reaparece convertido en amenaza.', 'El objetivo ya no está: alguien se les adelantó.', 'Un ser querido de un PJ está implicado hasta el cuello.', 'Lo que buscaban existe, pero no es lo que creían.', 'La autoridad local decide que los PJ son los culpables.', 'El precio de avanzar es traicionar a alguien.', 'El reloj salta dos segmentos: se acaba el tiempo antes de lo previsto.', 'Dos objetivos se vuelven incompatibles: hay que elegir.', 'El favor que pidieron tiene un coste que no confesaron.'];
export const genComplication = () => rand(COMPL);

// ───────────────────────── MALDICIONES ─────────────────────────
const CUR_NAME = ['El Marchitar', 'La Voz Prestada', 'El Sueño de Sal', 'La Deuda Roja', 'El Ojo Interior', 'La Sombra Hambrienta', 'El Silencio Creciente', 'La Piel de Otro'];
const CUR_EFF = ['cada noche olvidas un nombre querido', 'tu reflejo actúa un instante después que tú', 'no puedes mentir, pero nadie te cree', 'envejeces un año por cada verdad que dices', 'oyes los pensamientos de los muertos cercanos', 'tu sombra señala a quien va a morir', 'el hierro te quema como brasa', 'sangras tinta en vez de sangre'];
export const genCurse = () => `${rand(CUR_NAME)}: ${rand(CUR_EFF)}.`;

// ───────────────────────── BARCOS ─────────────────────────
const SHIP_N = [['Sirena', 'f'], ['Cormorán', 'm'], ['Aguja', 'f'], ['Tridente', 'm'], ['Espectro', 'm'], ['Doncella', 'f'], ['Albatros', 'm'], ['Quilla', 'f'], ['Tempestad', 'f'], ['Rémora', 'f'], ['Faro', 'm'], ['Ancla', 'f'], ['Gaviota', 'f'], ['Arpón', 'm']];
const SHIP_ADJ = ['Errante', 'Negro', 'Silencioso', 'Perdido', 'Insomne', 'Hundido', 'Pálido', 'Voraz', 'Último', 'Ciego', 'Afortunado'];
export function genShip() {
  const [n, g] = rand(SHIP_N); const art = g === 'f' ? 'La' : 'El';
  return `${art} ${n} ${inflect(rand(SHIP_ADJ), g)}`;
}

// ───────────────────────── DISTRITOS / CALLES ─────────────────────────
const DIST_TAG = ['Bajo', 'Viejo', 'Torcido', 'Ahogado', 'de la Ceniza', 'de los Curtidores', 'de las Ánimas', 'del Farol', 'de la Horca', 'de los Vidrios', 'de la Sal', 'del Mercado Muerto'];
export function genDistrict() {
  const t = rand(DIST_TAG); const r = Math.random();
  if (r < 0.4) return contract(`Barrio ${t}`);
  if (r < 0.7) return contract(`Callejón ${t}`);
  if (r < 0.85) return contract(`El Arrabal ${t}`);
  return contract(`Calle ${t.startsWith('de') ? t : inflect(t, 'f')}`);
}

// ───────────────────────── ÚLTIMAS PALABRAS ─────────────────────────
const DYING = ['«No era… lo que dijeron…»', '«Mira debajo de la piedra del hogar.»', '«Ya viene. Siempre estuvo… debajo.»', '«Perdona a Marek. No sabía.»', '«La llave… me la tragué…»', '«No abráis la sexta puerta.»', '«Éramos siete. Solo quedo… yo.»', '«Díselo a mi hija. Ella entenderá.»', '«El pacto no se cierra con sangre. Con nombres.»', '«Gracias… por fin puedo… dormir.»', '«El que sonríe no es él.»', '«Conté los días. Hoy es el último.»'];
export const genDyingWords = () => rand(DYING);

// ───────────────────────── BESTIAS ─────────────────────────
const B_SIZE = ['diminuta', 'del tamaño de un perro', 'descomunal', 'colosal', 'esbelta', 'informe'];
const B_BASE = ['criatura sin ojos', 'bestia de muchas patas', 'cosa de niebla y dientes', 'sierpe pálida', 'ave carroñera', 'masa reptante', 'figura casi humana'];
const B_FEAT = ['cubierta de bocas', 'con la piel como cera fría', 'que zumba al moverse', 'que huele a tumba abierta', 'con demasiadas articulaciones', 'que proyecta la sombra equivocada', 'recubierta de sal cristalizada'];
const B_BEH = ['imita voces para atraer a su presa', 'solo ataca a quien la mira', 'se alimenta de recuerdos', 'deja un rastro de escarcha', 'no puede cruzar agua corriente', 'se multiplica si la hieres', 'duerme un siglo entre comidas'];
export const genBeast = () => `Una ${rand(B_BASE)} ${rand(B_SIZE)}, ${rand(B_FEAT)}; ${rand(B_BEH)}.`;

// ───────────────────────── JURAMENTOS ─────────────────────────
const OATH = ['¡Por las barbas de Vhuzoth!', '¡Que la Marea me trague!', '¡Por los siete sellos!', '¡Sangre y sal!', '¡Que el Ojo me olvide!', '¡Por el Trono Vacío!', '¡Así arda mi nombre!', '¡Por la Última Puerta!', '¡Que los ahogados me escuchen!', '¡Por la hora undécima!'];
export const genOath = () => rand(OATH);
