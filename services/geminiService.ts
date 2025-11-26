
import { GoogleGenAI } from "@google/genai";
import { Activity, Member } from "../types";

const getApiKey = (): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env.API_KEY || '';
    }
    return '';
  } catch (e) {
    return '';
  }
};

const getAiClient = () => {
  // Returns client or throws if key is missing/invalid, handled by callers
  return new GoogleGenAI({ apiKey: getApiKey() });
};

export const getWindCoachingTip = async (
  member: Member,
  lastActivity?: Activity
): Promise<string> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Você é o "Coach Eólico", a Inteligência Artificial oficial da equipe de corrida "Filhos do Vento".
    
    Sua Identidade:
    - Você é um mentor sábio, levemente filosófico e obcecado pela aerodinâmica da corrida.
    - Você CONHECE profundamente o Rio de Janeiro. Cite especificamente: Aterro do Flamengo (vento contra na volta), Parque do Flamengo (retas rápidas), Lagoa Rodrigo de Freitas (reta do Corte do Cantagalo), Praia do Leblon (maresia).
    - Use MUITAS metáforas de vento: "cortar o ar", "brisa leve", "rajada", "furacão", "voar baixo", "resistência aerodinâmica".
    - Seu tom é motivador, mas técnico.
    
    Dados do atleta ${member.name}:
    - Rank atual na Escala de Ventos: ${member.rank}
    - Distância total acumulada: ${member.totalDistance} km
    
    ${lastActivity 
      ? `Última corrida: ${lastActivity.distanceKm}km em ${lastActivity.durationMin} minutos (Pace: ${lastActivity.pace}). Sentimento: ${lastActivity.feeling}. Notas do atleta: ${lastActivity.notes}` 
      : "O atleta ainda não correu recentemente."}

    Sua missão:
    Dê um conselho curto (máximo 2 frases) personalizado para hoje.
    Exemplos de estilo:
    "No Parque do Flamengo, a pista ampla convida para velocidade. Hoje é dia de ser Rajada."
    "Seu pace está fluindo como a brisa na Lagoa. Mantenha a leveza nos ombros."
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Mantenha a postura e deixe o vento te levar!";
  } catch (error) {
    console.error("Erro ao consultar o Coach Eólico:", error);
    return "O vento está mudando de direção. Tente novamente em breve.";
  }
};

export const getTrainingAnalysis = async (activities: Activity[]): Promise<string> => {
    const model = 'gemini-2.5-flash';

    if (activities.length === 0) return "Ainda não há dados suficientes para uma análise eólica. Corra mais para gerar turbulência!";

    // 1. Pré-cálculo de Estatísticas Avançadas
    const totalRuns = activities.length;
    const totalDist = activities.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const totalTimeMin = activities.reduce((acc, curr) => acc + curr.durationMin, 0);
    const totalElevation = activities.reduce((acc, curr) => acc + (curr.elevationGain || 0), 0);
    
    // Cálculo de Pace Médio Global
    const avgPaceDec = totalDist > 0 ? totalTimeMin / totalDist : 0;
    const avgPaceMin = Math.floor(avgPaceDec);
    const avgPaceSec = Math.round((avgPaceDec - avgPaceMin) * 60);
    const avgPaceStr = `${avgPaceMin}'${avgPaceSec.toString().padStart(2, '0')}"/km`;

    // Identificar Recordes (Melhor Pace e Maior Distância)
    const longestRun = Math.max(...activities.map(a => a.distanceKm));
    const fastestActivity = activities.reduce((prev, current) => {
        const prevPace = parseFloat(prev.pace.replace("'", ".").replace('"', ''));
        const currPace = parseFloat(current.pace.replace("'", ".").replace('"', ''));
        return (currPace < prevPace && currPace > 0) ? current : prev;
    });

    // Filtrar Treinos Recentes (Últimos 5) para Contexto Imediato
    const sortedActivities = [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentActivities = sortedActivities.slice(0, 5);
    
    const recentLog = recentActivities.map(a => 
        `- Data: ${new Date(a.date).toLocaleDateString()} | Dist: ${a.distanceKm}km | Pace: ${a.pace} | Elev: ${a.elevationGain || 0}m | Sentimento: ${a.feeling} | Nota: "${a.notes || ''}"`
    ).join('\n');

    const prompt = `
      Atue como o Cientista de Dados Esportivos Sênior da equipe "Filhos do Vento".
      Sua tarefa é gerar um DOSSIÊ TÉCNICO DE PERFORMANCE para este atleta.

      ## 📊 DADOS QUANTITATIVOS GERAIS
      - Total de Sessões: ${totalRuns}
      - Volume Total Acumulado: ${totalDist.toFixed(1)} km
      - Ganho de Elevação Total: ${totalElevation} m
      - Pace Médio Histórico: ${avgPaceStr}
      - Maior Distância (Longão): ${longestRun} km
      - Recorde de Ritmo (Fastest Pace): ${fastestActivity.pace} em ${fastestActivity.distanceKm}km

      ## 🗓️ ATIVIDADE RECENTE (Últimos 5 Treinos)
      ${recentLog}

      ## ESTRUTURA DO RELATÓRIO (Markdown)
      Analise os dados acima e gere um relatório com as seguintes seções. Use negrito para métricas importantes.

      1. **Diagnóstico de Consistência 🧬**
         - Analise se o atleta mantém regularidade ou tem muitos hiatos.
         - O volume atual é sustentável?

      2. **Análise Aerodinâmica (Velocidade & Ritmo) ⚡**
         - Compare o Pace Médio Histórico com os treinos recentes. Estamos evoluindo, estagnados ou regredindo?
         - O atleta sabe variar ritmos (tem treinos lentos e rápidos) ou corre sempre na "zona cinzenta"?

      3. **Fator Terreno e Força ⛰️**
         - Baseado na elevação, o atleta encara subidas? Sugira locais do RJ (ex: Vista Chinesa, Paineiras) se faltar força.

      4. **Veredito do Vento 🎯**
         - Uma conclusão direta e motivadora. Defina o foco para a próxima semana (ex: "Focar em volume", "Descanso ativo", "Treino de Tiros").

      Seja técnico, preciso, mas mantenha a identidade "Filhos do Vento".
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text || "Análise indisponível no momento. O vento está interferindo no sinal.";
    } catch (error) {
        console.error("Erro na análise completa:", error);
        return "Erro ao processar o dossiê completo dos dados.";
    }
}

export const getNutritionAdvice = async (query: string): Promise<string> => {
  const model = 'gemini-2.5-flash';

  const prompt = `
    Você é o especialista em nutrição da equipe "Filhos do Vento". 
    Seu lema é "Combustível Leve para Voar".
    
    O usuário perguntou: "${query}"
    
    Responda com base científica esportiva.
    Destaque alimentos que não "pesam" para correr no calor do Rio de Janeiro.
    Sugira hidratação (água de coco, isotônicos) sempre que possível.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "O Nutri-Vento está em consulta. Tente depois.";
  } catch (error) {
    return "Erro ao consultar nutrição.";
  }
};

export const generateTrainingPlan = async (
  rank: string,
  goal: string,
  daysPerWeek: number,
  experienceLevel: string
): Promise<string> => {
  const model = 'gemini-2.5-flash';

  const prompt = `
    Crie uma planilha de treinos de corrida de 4 semanas para um membro da equipe Filhos do Vento.
    
    Perfil do Atleta:
    - Rank Atual: ${rank}
    - Nível de Experiência: ${experienceLevel}
    - Objetivo Principal: ${goal}
    - Disponibilidade: ${daysPerWeek} dias/semana.

    Diretrizes baseadas no Nível (${experienceLevel}):
    ${experienceLevel === 'Iniciante' ? "- FOCO: Adaptação cardiovascular, alternância caminhada/corrida (CA/CO), volume baixo e prevenção de lesões." : ""}
    ${experienceLevel === 'Intermediário' ? "- FOCO: Aumento de volume progressivo, introdução de treinos Fartlek e ritmo constante." : ""}
    ${experienceLevel === 'Avançado' ? "- FOCO: Alta performance, Tiros intervalados de alta intensidade (VO2 máx), Longões de resistência com ritmo de prova e Tempo Run." : ""}

    A resposta deve ser em Markdown limpo e estruturado.
    Estrutura Obrigatória:
    1. **Filosofia do Ciclo**: Uma frase inspiradora sobre o vento, adequada ao nível ${experienceLevel}.
    2. **Foco Técnico**: Em 2 bullet points, o que será trabalhado (ex: Cadência, Respiração, Postura).
    3. **O Plano de Voo (4 Semanas)**: 
       - Detalhe Semana 1 a 4.
       - Para cada treino, sugira locais do RJ:
         * Velocidade: Parque do Flamengo ou Aterro.
         * Rodagem: Lagoa Rodrigo de Freitas.
         * Força/Subida: Vista Chinesa ou Paineiras.
         * Longão: Orla Leblon ao Leme.
    4. **Recuperação**: Dica específica para ${experienceLevel}.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a rota de voo agora.";
  } catch (error) {
    return "Erro ao gerar planilha.";
  }
};
