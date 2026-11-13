// Significados-base das 78 cartas (Rider-Waite-Smith), em português do Brasil.
// Servem de base consistente para a interpretação (e aparecem na tela mesmo sem IA).
// Tom: reflexão e autoconhecimento. Nunca previsão de morte, doença ou desastre.

export type Suit = "paus" | "copas" | "espadas" | "ouros";

export interface TarotCard {
  /** m00..m21 (Arcanos Maiores) ou w/c/s/p + 01..14 (Paus, Copas, Espadas, Ouros) */
  id: string;
  name: string;
  arcana: "maior" | "menor";
  suit?: Suit;
  /** número da carta (0-21 nos Maiores; 1-14 nos Menores, onde 11 = Valete, 12 = Cavaleiro, 13 = Rainha, 14 = Rei) */
  number: number;
  keywords: string[];
  upright: string;
  reversed: string;
}

type Row = [id: string, name: string, keywords: string, upright: string, reversed: string];

const MAIORES: Row[] = [
  ["m00", "O Louco", "recomeço, espontaneidade, confiança, abertura", "Início de um novo ciclo e abertura ao desconhecido. Convida a dar um passo com leveza e curiosidade, confiando no próprio caminho.", "Impulsividade sem olhar as consequências, ou medo de começar. Pede um meio-termo entre ousar e se preparar."],
  ["m01", "O Mago", "vontade, habilidade, foco, manifestação", "Você tem os recursos e o talento para transformar uma ideia em realidade. É um momento de foco e de agir com intenção.", "Talentos subaproveitados, dispersão ou uso pouco honesto da influência. Vale reunir o que você já tem antes de agir."],
  ["m02", "A Sacerdotisa", "intuição, silêncio, mistério, interioridade", "A resposta está em ouvir o que você já sabe por dentro. Valoriza a observação, o silêncio e a intuição.", "Dúvida em confiar na própria intuição, ou segredos e desconexão interior. Pede uma pausa para escutar a si mesma(o)."],
  ["m03", "A Imperatriz", "criatividade, cuidado, abundância, sensibilidade", "Fase de criar, nutrir e receber. Fala de acolhimento, prazer, conexão com o corpo e com a natureza.", "Excesso de cuidado com os outros e pouco consigo, ou criatividade travada. Lembra de equilibrar o dar e o receber."],
  ["m04", "O Imperador", "estrutura, autoridade, estabilidade, disciplina", "Pede organização, limites claros e responsabilidade. Mostra a força de construir bases sólidas.", "Rigidez, controle excessivo ou, ao contrário, falta de disciplina. Convida a flexibilizar sem perder a firmeza."],
  ["m05", "O Hierofante", "tradição, aprendizado, valores, orientação", "Busca de sentido em valores, ensinamentos e comunidades. Pode indicar aprender com um mestre ou seguir um caminho conhecido.", "Questionar regras que já não servem, ou prender-se a dogmas. Convida a escolher seus próprios valores."],
  ["m06", "Os Enamorados", "escolhas, amor, valores, alinhamento", "Uma escolha importante que envolve o coração e os valores. Fala de relações autênticas e de coerência interna.", "Desalinhamento entre o que se sente e o que se faz, ou indecisão. Pede honestidade consigo e com o outro."],
  ["m07", "O Carro", "direção, determinação, vitória, disciplina", "Avanço por foco e autodisciplina. Você pode conduzir forças opostas na mesma direção.", "Falta de direção, pressa ou sensação de perder o controle. Ajuda parar e escolher o rumo antes de acelerar."],
  ["m08", "A Força", "coragem gentil, paciência, domínio de si, compaixão", "A verdadeira força é suave e persistente. Mostra a coragem de lidar com os próprios impulsos com carinho.", "Insegurança, cansaço ou dúvida sobre a própria capacidade. Lembra que vulnerabilidade também é coragem."],
  ["m09", "O Eremita", "introspecção, busca de sentido, sabedoria, solitude", "Momento de olhar para dentro e buscar a própria luz. A solitude escolhida traz clareza.", "Isolamento excessivo ou recusa de ajuda. Convida a voltar ao convívio levando o que você descobriu."],
  ["m10", "A Roda da Fortuna", "ciclos, mudança, oportunidade, movimento", "Tudo está em movimento: fases mudam e novas oportunidades surgem. Pede flexibilidade diante do que não depende de você.", "Resistência à mudança ou sensação de estar à mercê das circunstâncias. Fases difíceis também passam."],
  ["m11", "A Justiça", "equilíbrio, verdade, responsabilidade, causa e efeito", "Pede clareza, honestidade e responsabilidade pelas próprias escolhas. Decisões justas e bem pesadas.", "Evitar assumir responsabilidades, ou sentir injustiça. Vale rever os fatos com imparcialidade."],
  ["m12", "O Enforcado", "pausa, nova perspectiva, entrega, desapego", "Uma pausa que traz outro ponto de vista. Soltar o controle pode revelar o que a pressa escondia.", "Resistir a uma pausa necessária, ou sacrifícios que não levam a nada. Pergunte-se o que vale a pena segurar."],
  ["m13", "A Morte", "fim de ciclo, transformação, renascimento, desapego", "Não é morte literal: fala do fim de um ciclo e do espaço que se abre para o novo. Transformação profunda.", "Apego ao que já terminou e dificuldade de seguir em frente. A transição pode ser lenta, e tudo bem."],
  ["m14", "A Temperança", "equilíbrio, moderação, paciência, integração", "Busca de equilíbrio e de uma mistura harmoniosa entre extremos. Pede paciência e constância.", "Excessos, pressa ou desequilíbrio entre áreas da vida. Convida a reencontrar o ritmo."],
  ["m15", "O Diabo", "apegos, tentações, sombra, padrões", "Mostra apegos, vícios ou padrões que prendem. As correntes costumam estar mais soltas do que parecem.", "Reconhecer um padrão e começar a se libertar. Momento de retomar o próprio poder."],
  ["m16", "A Torre", "ruptura, revelação, quebra de ilusões, reconstrução", "Mudança súbita que derruba o que estava frágil e revela a verdade. Abre espaço para reconstruir sobre bases mais firmes.", "Medo de uma mudança necessária ou rupturas que vêm de forma mais suave. Evitar o inevitável só adia a clareza."],
  ["m17", "A Estrela", "esperança, renovação, serenidade, inspiração", "Esperança e cura depois de um período difícil. Fala de fé no futuro e de se reconectar com o que inspira.", "Desânimo ou perda de fé. Pequenos gestos de cuidado ajudam a reacender a esperança."],
  ["m18", "A Lua", "intuição, incerteza, sonhos, medos", "Terreno incerto, em que nem tudo é o que parece. Pede atenção aos sonhos, às intuições e aos medos que se projetam.", "Medos se dissolvendo e a confusão se esclarecendo, aos poucos. Dê tempo para a clareza chegar."],
  ["m19", "O Sol", "alegria, vitalidade, clareza, sucesso", "Clareza, otimismo e energia. Fala de alegria genuína, de ser visto como se é e de colher o que foi cultivado.", "Alegria temporariamente reduzida ou otimismo exagerado. A luz continua ali, só pede paciência."],
  ["m20", "O Julgamento", "chamado, reflexão, renovação, perdão", "Um chamado para rever o caminho percorrido, perdoar e renascer com mais consciência.", "Autocrítica severa ou dúvida diante de um chamado. Convida a se tratar com a mesma gentileza que teria com alguém querido."],
  ["m21", "O Mundo", "conclusão, integração, plenitude, realização", "Um ciclo se completa com sensação de integração e realização. É hora de celebrar e olhar para o próximo passo.", "Ciclo quase concluído, mas faltando um último fechamento. Peça final a ser ajustada antes de seguir."],
];

const PAUS: Row[] = [
  ["w01", "Ás de Paus", "centelha, inspiração, iniciativa, energia", "Uma centelha de inspiração e energia para começar algo novo.", "Energia bloqueada, falta de motivação ou atraso para começar."],
  ["w02", "Dois de Paus", "planejamento, escolhas, visão, decisão", "Hora de planejar e escolher o próximo passo olhando para o futuro.", "Indecisão ou medo de sair da zona de conforto."],
  ["w03", "Três de Paus", "expansão, perspectiva, espera ativa, horizontes", "Seus planos estão em andamento e há horizontes se abrindo. Vale confiar no processo.", "Atrasos e frustração, ou visão curta demais sobre o que vem pela frente."],
  ["w04", "Quatro de Paus", "celebração, estabilidade, comunidade, lar", "Momento de comemorar conquistas e de se sentir em casa, em segurança e acompanhada(o).", "Instabilidade ou desconforto no ambiente; uma celebração adiada."],
  ["w05", "Cinco de Paus", "competição, conflito, diferenças, disputa", "Choque de ideias ou competição. Pode ser estimulante se houver respeito.", "Tensão contida ou evitar conflitos. Também pode indicar o fim de uma disputa."],
  ["w06", "Seis de Paus", "vitória, reconhecimento, confiança, orgulho", "Reconhecimento e confiança depois de um esforço. Um momento de visibilidade merecida.", "Ego inflado ou falta de reconhecimento. Lembre de valorizar o próprio caminho."],
  ["w07", "Sete de Paus", "defesa, perseverança, posição, coragem", "Manter sua posição diante de desafios. Pede firmeza e coragem.", "Cansaço, sobrecarga ou vontade de desistir. Vale escolher onde investir energia."],
  ["w08", "Oito de Paus", "movimento, rapidez, notícias, avanço", "As coisas se movem depressa: mensagens, viagens, avanços. Aproveite o ritmo.", "Atrasos, pressa ou desorganização. Desacelerar ajuda a não perder o rumo."],
  ["w09", "Nove de Paus", "resiliência, cansaço, persistência, cautela", "Você já andou bastante e está perto do fim. Resiliência e cuidado com os limites.", "Esgotamento ou teimosia. Descansar também é parte do caminho."],
  ["w10", "Dez de Paus", "sobrecarga, responsabilidade, peso, compromisso", "Responsabilidades acumuladas. Convida a ver o que pode ser dividido ou deixado.", "Aprender a delegar e a soltar fardos que não são seus."],
  ["w11", "Valete de Paus", "curiosidade, entusiasmo, mensagem, criatividade", "Entusiasmo e vontade de explorar. Uma ideia ou mensagem nova que desperta a curiosidade.", "Ideias sem ação, dispersão ou imaturidade. Escolha uma para começar."],
  ["w12", "Cavaleiro de Paus", "aventura, impulso, paixão, ação", "Energia, paixão e vontade de ir em frente. Cheio de entusiasmo para o que for novo.", "Impaciência e precipitação. Respirar antes de agir evita desgastes."],
  ["w13", "Rainha de Paus", "confiança, carisma, calor, independência", "Calor humano, confiança e magnetismo. Fala de se expressar com autenticidade.", "Insegurança, ciúme ou humor instável. Confie mais em si."],
  ["w14", "Rei de Paus", "liderança, visão, empreendedorismo, inspiração", "Liderança inspiradora e visão de longo prazo. Capacidade de transformar ideias em ação.", "Autoritarismo, impulsividade ou expectativas altas demais."],
];

const COPAS: Row[] = [
  ["c01", "Ás de Copas", "novo sentimento, abertura emocional, amor, intuição", "Abertura emocional: um novo sentimento ou uma conexão que nasce. Coração aberto para receber.", "Emoções reprimidas, vazio ou dificuldade de se abrir."],
  ["c02", "Dois de Copas", "parceria, reciprocidade, conexão, harmonia", "Conexão e reciprocidade entre duas pessoas. Respeito e troca equilibrada.", "Desequilíbrio, mal-entendidos ou afastamento em um vínculo."],
  ["c03", "Três de Copas", "amizade, celebração, comunidade, alegria", "Alegria compartilhada, amizades e celebração em grupo.", "Excessos, fofocas ou sensação de ficar de fora do grupo."],
  ["c04", "Quatro de Copas", "apatia, contemplação, reavaliação, oportunidade", "Pausa contemplativa, às vezes com desânimo. Atenção ao que está sendo oferecido e não é visto.", "Despertar de um novo interesse e sair do tédio."],
  ["c05", "Cinco de Copas", "perda, luto, arrependimento, o que resta", "Tristeza por uma perda. A carta também lembra o que ainda está de pé.", "Aceitação, perdão e passos para seguir em frente."],
  ["c06", "Seis de Copas", "nostalgia, memórias, infância, gentileza", "Lembranças afetivas, gestos de carinho e reencontros com o passado.", "Prender-se ao passado ou idealizá-lo. Hora de amadurecer a lembrança."],
  ["c07", "Sete de Copas", "sonhos, opções, fantasia, ilusões", "Muitas possibilidades e fantasias. Pede discernir o que é desejo e o que é viável.", "Escolha mais clara ou, ao contrário, confusão. Volte aos fatos."],
  ["c08", "Oito de Copas", "partida, busca de sentido, desapego, mudança", "Deixar para trás o que já não preenche, em busca de algo mais significativo.", "Medo de partir ou permanecer onde não há mais satisfação."],
  ["c09", "Nove de Copas", "satisfação, desejo realizado, gratidão, bem-estar", "Contentamento e realização de um desejo. Gratidão pelo que foi conquistado.", "Insatisfação, vaidade ou excesso. Nem tudo se resolve com ter mais."],
  ["c10", "Dez de Copas", "harmonia, família, plenitude emocional, pertencimento", "Plenitude afetiva, harmonia em casa e senso de pertencimento.", "Desarmonia ou valores desalinhados; idealização do que seria perfeito."],
  ["c11", "Valete de Copas", "sensibilidade, mensagem afetiva, criatividade, curiosidade", "Uma mensagem afetuosa ou uma ideia criativa. Sensibilidade e curiosidade emocional.", "Imaturidade emocional, escapismo ou carência."],
  ["c12", "Cavaleiro de Copas", "romance, convite, idealismo, sensibilidade", "Um convite, uma proposta romântica ou criativa, feita com o coração.", "Promessas vazias, humor instável ou desilusão com expectativas altas."],
  ["c13", "Rainha de Copas", "empatia, intuição, cuidado, compaixão", "Empatia profunda e intuição. Acolhe as emoções sem se perder nelas.", "Dependência emocional, hipersensibilidade ou limites difusos."],
  ["c14", "Rei de Copas", "equilíbrio emocional, diplomacia, compaixão, maturidade", "Maturidade emocional: sentir sem ser dominada(o) pelo sentimento.", "Repressão emocional, manipulação ou oscilações de humor."],
];

const ESPADAS: Row[] = [
  ["s01", "Ás de Espadas", "clareza, verdade, avanço mental, decisão", "Clareza súbita e verdade. Uma ideia ou decisão corta a confusão.", "Confusão, comunicação dura ou raciocínio nublado."],
  ["s02", "Dois de Espadas", "impasse, decisão adiada, equilíbrio tenso, indecisão", "Um impasse em que não se quer ver o que está em jogo. Pede coragem para escolher.", "O impasse se desfaz ou a ansiedade cresce. Informações escondidas vêm à tona."],
  ["s03", "Três de Espadas", "mágoa, dor emocional, tristeza, cura", "Uma dor emocional que precisa ser reconhecida para ser cuidada.", "Recuperação, perdão ou dificuldade de soltar uma mágoa."],
  ["s04", "Quatro de Espadas", "descanso, pausa, recuperação, silêncio", "Hora de descansar e se recuperar. A pausa renova as forças.", "Inquietação ou esgotamento. Voltar à ação aos poucos."],
  ["s05", "Cinco de Espadas", "conflito, vitória vazia, tensão, orgulho", "Conflito em que ganhar pode custar caro. Convida a escolher as batalhas.", "Reconciliação, arrependimento ou deixar a briga para trás."],
  ["s06", "Seis de Espadas", "transição, travessia, alívio, calma", "Travessia para águas mais calmas, mesmo levando bagagem emocional.", "Resistência a mudar ou dificuldade de largar o que pesa."],
  ["s07", "Sete de Espadas", "estratégia, discrição, evasão, cautela", "Agir com cautela e estratégia. Também pode apontar para algo não dito.", "Honestidade, confissão e assumir uma verdade."],
  ["s08", "Oito de Espadas", "sentir-se preso, limites autoimpostos, medo, restrição", "Sensação de estar preso, muitas vezes por crenças e medos que dá para rever.", "Libertação, novos pontos de vista e soltar as amarras."],
  ["s09", "Nove de Espadas", "ansiedade, preocupação, insônia, medo", "Preocupações que pesam, sobretudo à noite. Compartilhar o que sente alivia.", "Esperança, pedir apoio e pensamentos exagerados perdendo força."],
  ["s10", "Dez de Espadas", "fim de ciclo, esgotamento, encerramento, alívio", "Um ciclo difícil chega ao fim. O pior já passou e há espaço para recomeçar.", "Recuperação gradual ou resistência em aceitar o fim."],
  ["s11", "Valete de Espadas", "curiosidade, novas ideias, vigilância, comunicação", "Mente curiosa e atenta, com vontade de aprender e questionar.", "Palavras precipitadas, fofoca ou falta de tato."],
  ["s12", "Cavaleiro de Espadas", "ação rápida, determinação, franqueza, foco", "Determinação e rapidez para ir atrás de um objetivo. Franqueza.", "Agressividade verbal, pressa e falta de plano."],
  ["s13", "Rainha de Espadas", "clareza, independência, honestidade, limites", "Clareza, independência e comunicação direta, com limites bem definidos.", "Frieza, crítica dura ou amargura. Lembre de incluir a empatia."],
  ["s14", "Rei de Espadas", "lucidez, justiça, autoridade intelectual, verdade", "Lucidez e decisões baseadas em princípios. Pensamento claro e justo.", "Rigidez, autoritarismo ou uso duro das palavras."],
];

const OUROS: Row[] = [
  ["p01", "Ás de Ouros", "oportunidade, semente, estabilidade, concretização", "Uma oportunidade concreta de começar algo sólido, no trabalho, no corpo ou nos recursos.", "Oportunidade deixada passar ou planejamento frágil."],
  ["p02", "Dois de Ouros", "equilíbrio, adaptação, prioridades, flexibilidade", "Equilibrar várias demandas com jogo de cintura e adaptação.", "Desorganização e sobrecarga ao tentar dar conta de tudo."],
  ["p03", "Três de Ouros", "trabalho em equipe, mestria, colaboração, qualidade", "Colaboração e reconhecimento do trabalho bem feito.", "Falta de alinhamento na equipe ou desleixo."],
  ["p04", "Quatro de Ouros", "segurança, controle, apego, conservação", "Busca de segurança e estabilidade, às vezes com medo de perder.", "Apego excessivo ou, ao contrário, soltar o controle."],
  ["p05", "Cinco de Ouros", "dificuldade, carência, exclusão, pedir ajuda", "Fase difícil, de sentir falta de apoio. A ajuda pode estar mais perto do que parece.", "Recuperação, ajuda chegando e superação do isolamento."],
  ["p06", "Seis de Ouros", "generosidade, reciprocidade, troca justa, apoio", "Troca equilibrada de ajuda e generosidade.", "Desequilíbrio entre dar e receber, ou ajuda com condições."],
  ["p07", "Sete de Ouros", "paciência, avaliação, colheita gradual, perseverança", "Paciência: o que foi plantado cresce no seu tempo. Hora de avaliar.", "Impaciência ou esforço sem retorno. Rever onde investir energia."],
  ["p08", "Oito de Ouros", "dedicação, aprimoramento, ofício, prática", "Dedicação e aprimoramento de uma habilidade, passo a passo.", "Perfeccionismo, tédio ou trabalho sem propósito."],
  ["p09", "Nove de Ouros", "independência, autossuficiência, conforto, merecimento", "Independência e prazer de colher o que foi cultivado com cuidado.", "Dependência ou excesso de trabalho; insegurança sobre o próprio valor."],
  ["p10", "Dez de Ouros", "legado, família, estabilidade, tradição", "Estabilidade duradoura, família, legado e raízes.", "Conflitos familiares ou instabilidade; tradições que pesam."],
  ["p11", "Valete de Ouros", "estudo, curiosidade prática, novo projeto, aprendizado", "Vontade de aprender algo concreto e de começar um projeto com os pés no chão.", "Procrastinação, falta de foco ou imediatismo."],
  ["p12", "Cavaleiro de Ouros", "constância, responsabilidade, método, paciência", "Constância e método. Avançar devagar, mas com segurança.", "Estagnação, teimosia ou perfeccionismo."],
  ["p13", "Rainha de Ouros", "cuidado prático, acolhimento, abundância, praticidade", "Acolhimento prático e senso de abundância. Cuida do corpo, da casa e das pessoas.", "Descuido consigo, sobrecarga ou apego a bens."],
  ["p14", "Rei de Ouros", "estabilidade, segurança, liderança prática, prosperidade", "Liderança prática e estabilidade construída com paciência.", "Apego a status, rigidez ou foco excessivo no material."],
];

function build(rows: Row[], arcana: "maior" | "menor", suit?: Suit): TarotCard[] {
  return rows.map(([id, name, keywords, upright, reversed], i) => ({
    id,
    name,
    arcana,
    ...(suit ? { suit } : {}),
    number: arcana === "maior" ? i : i + 1,
    keywords: keywords.split(", "),
    upright,
    reversed,
  }));
}

export const TAROT_DECK: readonly TarotCard[] = [
  ...build(MAIORES, "maior"),
  ...build(PAUS, "menor", "paus"),
  ...build(COPAS, "menor", "copas"),
  ...build(ESPADAS, "menor", "espadas"),
  ...build(OUROS, "menor", "ouros"),
];

const BY_ID = new Map(TAROT_DECK.map((c) => [c.id, c]));

export function getCard(id: string): TarotCard | undefined {
  return BY_ID.get(id);
}
