import { tool } from "ai";
import z from "zod";
import { AppError } from "../../errors/AppError";
import { logger } from "../../config/logger/logger";
import prisma from "../../prisma/client";

type AllowedTable = 'User' | 'Plan' | 'Subscription' | 'Payment' | 'Resume' | 'ResumeAnalysis';

const ALLOWED_TABLES: AllowedTable[] = ['User', 'Plan', 'Subscription', 'Payment', 'Resume', 'ResumeAnalysis'];

const ALLOWED_COLUMNS_BY_TABLE: Record<AllowedTable, string[]> = {
  User: ['id', 'username', 'email', 'firstname', 'lastname', 'role', 'created_at'],
  Plan: ['id', 'name', 'price', 'slug', 'billing_cycle', 'analysis_limit', 'is_active'],
  Subscription: ['id', 'user_id', 'plan_id', 'status', 'start_date', 'end_date', 'created_at'],
  Payment: ['id', 'user_id', 'subscription_id', 'amount', 'currency', 'status', 'payment_method', 'created_at'],
  Resume: ['id', 'user_id', 'file_name', 'created_at'],
  ResumeAnalysis: ['id', 'resume_id', 'score', 'processed_at']
};

const MAX_RESULTS = 50;

export const postgresTools = tool({
  description: `
  Realiza consultas SELECT seguras no banco de dados PostgreSQL.
  
  Tabelas e colunas permitidas:
  ${Object.entries(ALLOWED_COLUMNS_BY_TABLE).map(([table, cols]) => 
    `- ${table}: ${cols.join(', ')}`).join('\n  ')}

  Limitações:
  - Máximo de ${MAX_RESULTS} resultados por consulta
  - Apenas operações SELECT são permitidas
  - Não são permitidas subconsultas ou joins
  `.trim(),
  parameters: z.object({
    query: z.string().describe('Consulta SELECT para executar. Exemplo: "SELECT name FROM user"'),
    params: z.array(z.string()).optional().describe('Parâmetros da query (opcional)'),
  }),
  execute: async ({ query }) => {
    try {
      logger.debug('[SQL TOOL] Query recebida:', { originalQuery: query });
      const cleanedQuery = query
        .trim()
        .replace(/;+/g, '') 
        .replace(/\s+/g, ' ');

        logger.debug('[SQL TOOL] Query limpa:', { cleanedQuery });

      if (!cleanedQuery.toLowerCase().startsWith('select')) {
        throw new AppError('Apenas operações SELECT são permitidas', 400);
      }

      const forbiddenPatterns = [
        /(\bdelete\b|\binsert\b|\bupdate\b|\bdrop\b|\btruncate\b)/gi,
        /(\bpg_\w+\b|\brun\b)/gi, 
        /(--|\/\*|\*\/)/gi 
      ];

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(cleanedQuery)) {
          logger.warn('[SQL TOOL] Operação proibida detectada', { 
            query,
            pattern: pattern.source
          });
          throw new AppError('Query contém operações não permitidas', 400);
        }
      }

      const fromClauseMatch = cleanedQuery.match(/from\s+(\w+)/i);
      const tableName = fromClauseMatch?.[1] as AllowedTable | undefined;

      logger.debug('[SQL TOOL] Tabela identificada:', { tableName });

      if (!tableName || !ALLOWED_TABLES.includes(tableName)) {
        logger.warn('[SQL TOOL] Tentativa de acesso a tabela não permitida', { 
          tableName,
          allowedTables: ALLOWED_TABLES
        });
        throw new AppError(`Acesso à tabela ${tableName || 'não especificada'} não é permitido`, 403);
      }

      const selectClauseMatch = cleanedQuery.match(/select\s+(.*?)\s+from/i);
      const selectedColumns = selectClauseMatch?.[1]
        ?.split(',')
        .map(col => {
          const cleanCol = col.split(/\sas\s/i)[0].trim().toLowerCase();
          return cleanCol.replace(/\(.*\)/, '').trim();
        })
        .filter(col => col !== '*') ?? [];

        logger.debug('[SQL TOOL] Colunas selecionadas:', { selectedColumns });

      if (selectedColumns.length > 0) {
        const allowedColumns = ALLOWED_COLUMNS_BY_TABLE[tableName].map(c => c.toLowerCase());
        
        for (const col of selectedColumns) {
          if (!allowedColumns.includes(col.toLowerCase())) {
            logger.warn('[SQL TOOL] Tentativa de acesso a coluna não permitida', {
              column: col,
              table: tableName,
              allowedColumns
            });
            throw new AppError(`Acesso à coluna ${col} na tabela ${tableName} não é permitido`, 403);
          }
        }
      }

      let finalQuery = cleanedQuery;
      if (!finalQuery.toLowerCase().includes('limit')) {
        finalQuery += ` LIMIT ${MAX_RESULTS}`;
      } else {
        finalQuery = finalQuery.replace(/limit\s+\d+/i, `LIMIT ${MAX_RESULTS}`);
      }

      const result = await prisma.$queryRawUnsafe(finalQuery);
      return JSON.stringify(result);
    } catch (error) {
      logger.error('Erro na execução da query:', { 
        error: error instanceof Error ? error.message : error,
        query
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Falha na execução da query', 500);
    }
  }
});

// import { tool } from "ai";
// import z from "zod";
// import prisma from "../../config/prisma/client";

// const ALLOWED_COLUMNS = ['id', 'username', 'email', 'created_at'];
// const ALLOWED_TABLE = 'user';

// export const postgresTools = tool({
//     description: `
//     Realiza consultas SELECT na tabela 'user' do PostgreSQL.

//     Estrutura da tabela:
//     - id (UUID, gerado automaticamente)
//     - username (VARCHAR(100))
//     - email (VARCHAR(255), único)
//     - created_at (TIMESTAMP, data de criação)

//     Limite: 50 resultados por consulta.
//   `.trim(),
//   parameters: z.object({
//     query: z.string().describe('Consulta SELECT para executar. Exemplo: "SELECT name FROM user"'),
//     params: z.array(z.string()).optional().describe('Parâmetros da query (opcional)'),
//   }),
//   execute: async ({ query }) => {
//     console.log(query)
//     const cleanedQuery = query
//     .trim()
//     .replace(/;+/g, '') 
//     .replace(/\s+/g, ' '); 

//   if (!cleanedQuery.toLowerCase().startsWith('select')) {
//     throw new Error('Apenas operações SELECT são permitidas');
//   }

//   const forbiddenPatterns = [
//     /(\bdelete\b|\binsert\b|\bupdate\b|\bdrop\b|\btruncate\b)/gi,
//     /(\bpg_\w+\b|\brun\b)/gi, 
//     /(--|\/\*|\*\/)/gi 
//   ];

//   for (const pattern of forbiddenPatterns) {
//     if (pattern.test(cleanedQuery)) {
//       throw new Error('Query contém operações não permitidas');
//     }
//   }

//   const fromClauseMatch = cleanedQuery.match(/from\s+(\w+)/i);
//   const tableName = fromClauseMatch?.[1]?.toLowerCase();

//   if (!tableName || tableName !== ALLOWED_TABLE) {
//     throw new Error('Acesso a tabelas não permitidas');
//   }

//   const selectedColumns = cleanedQuery
//     .match(/select\s+(.*?)\s+from/i)?.[1]
//     .split(',')
//     .map(col => col.trim().toLowerCase());

//   if (selectedColumns?.some(col => !ALLOWED_COLUMNS.includes(col))) {
//     throw new Error('Tentativa de acesso a colunas não permitidas');
//   }

//   const finalQuery = cleanedQuery
//     .replace(/limit\s+\d+/gi, '')
//     .concat(` LIMIT 50`);

//   try {
//     const result = await prisma.$queryRawUnsafe(finalQuery);
//     return JSON.stringify(result);
//   } catch (error) {
//     console.error('Erro na query:', error);
//     throw new Error('Falha na execução da query');
//   }
// }
// });