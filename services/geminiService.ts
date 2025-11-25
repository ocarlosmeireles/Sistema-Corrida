
import { GoogleGenAI } from "@google/genai";
import { Activity, Member } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    if (activities.length === 0) return "Ainda não sinto o deslocamento de ar dos seus treinos. Corra para gerar dados!";

    // Pré-cálculo de métricas totais para ajudar a IA
    const totalRuns = activities.length;
    const totalElevation = activities.reduce((acc, curr) => acc + (curr.elevationGain || 0), 0);
    const totalDist = activities.reduce((acc, curr) => acc + curr.distanceKm, 0);
    
    // Formatar histórico completo (sem slice)
    // Ordenar por data (antigo -> novo) para análise de evolução
    const sortedActivities = [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const historyStr = sortedActivities.map(a => 
        `- Data: ${a.date} | Dist: ${a.distanceKm}km | Tempo: ${a.durationMin}min | Pace: ${a.pace} | Elev: ${a.elevationGain || 0}m | Feeling: ${a.feeling}`
    ).join('\n');

    const prompt = `
      Atue como o "Coach Eólico" da equipe Filhos do Vento. Realize uma análise técnica profunda do histórico COMPLETO deste corredor.
      
      Métricas Gerais Pré-calculadas:
      - Total de Treinos: ${totalRuns}
      - Distância Total Analisada: ${totalDist.toFixed(1)} km
      - Ganho de Elevação Acumulado: ${totalElevation} m

      Log de Atividades (Cronológico):
      ${historyStr}

      Sua tarefa é gerar um relatório estruturado em Markdown abordando os seguintes pilares:

      1. **Consistência Aerodinâmica (Pace):**
         - O pace médio está evoluindo (ficando mais rápido) ou estagnado?
         - Existe muita variação (instabilidade) ou o atleta mantém um "ritmo de cruzeiro" sólido?

      2. **Domínio do Terreno (Elevação):**
         - O atleta tem enfrentado subidas (ganho de elevação)?
         - Com base nos dados de elevação, sugira se ele precisa de mais treinos de força/ladeira (ex: Vista Chinesa).

      3. **Volume & Frequência:**
         - Aumentou a distância recentemente ou está diminuindo?
         - O padrão de "feeling" indica risco de burnout ou motivação alta?

      4. **Veredito do Vento:**
         - Uma conclusão final motivadora usando metáforas de vento (ex: "Você está se tornando um Furacão", "Sua base é sólida como uma calmaria").

      Seja direto, técnico, mas inspirador. Use emojis para destacar pontos chave.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text || "Análise momentaneamente indisponível devido a turbulência nos dados.";
    } catch (error) {
        return "Erro ao processar a análise temporal completa.";
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
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a rota de voo agora.";
  } catch (error) {
    return "Erro ao gerar planilha.";
  }
};
