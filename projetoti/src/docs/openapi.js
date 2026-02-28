const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sky CIA API',
    version: '1.0.0',
    description: 'API do sistema de gestao aeroportuaria (auth, voos e IA).',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Autenticacao e seguranca da conta' },
    { name: 'Voos', description: 'Dados operacionais de voos' },
    { name: 'IA', description: 'Risco de atraso e chat IA' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Erro ao fazer login' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', example: 'admin@aeroporto.com' },
          senha: { type: 'string', example: 'admin123' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', example: 'Operador Sistema' },
          email: { type: 'string', example: 'operador@aeroporto.com' },
          senha: { type: 'string', example: '123456' },
          perfil: {
            type: 'string',
            enum: ['ADMIN', 'OPERADOR', 'CIA', 'PASSAGEIRO'],
            example: 'OPERADOR',
          },
          companhia: { type: 'string', nullable: true, example: 'LATAM' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          usuario: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              nome: { type: 'string', example: 'Operador Sistema' },
              email: { type: 'string', example: 'operador@aeroporto.com' },
              perfil: { type: 'string', example: 'OPERADOR' },
              companhia: { type: 'string', nullable: true, example: null },
            },
          },
        },
      },
      MeResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Operador Sistema' },
          email: { type: 'string', example: 'operador@aeroporto.com' },
          perfil: { type: 'string', example: 'OPERADOR' },
          companhia: { type: 'string', nullable: true, example: null },
          criado_em: { type: 'string', format: 'date-time' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: '123456' },
          newPassword: { type: 'string', example: 'novaSenha123' },
        },
      },
      TwoFaStatusResponse: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', example: true },
        },
      },
      SessionsResponse: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 12 },
                jti: { type: 'string', example: '6cf4f831-9c05-4db6-a43f-6de2ea2f63f0' },
                user_agent: { type: 'string', nullable: true },
                ip: { type: 'string', nullable: true },
                ativa: { type: 'integer', enum: [0, 1], example: 1 },
                criado_em: { type: 'string', format: 'date-time' },
                revogada_em: { type: 'string', format: 'date-time', nullable: true },
              },
            },
          },
        },
      },
      Voo: {
        type: 'object',
        properties: {
          numero_voo: { type: 'string', example: 'LA1234' },
          companhia: { type: 'string', example: 'LATAM' },
          horario_previsto: { type: 'string', format: 'date-time' },
          status: { type: 'string', example: 'EM_VOO' },
          preco_medio: { type: 'string', example: '450.00' },
        },
      },
      RiscoAtrasoResponse: {
        type: 'object',
        properties: {
          numero_voo: { type: 'string', example: 'LA1234' },
          risco: {
            type: 'object',
            properties: {
              percent: { type: 'integer', example: 35 },
              label: { type: 'string', example: 'moderado' },
            },
          },
        },
      },
      ChatRequest: {
        type: 'object',
        required: ['pergunta'],
        properties: {
          pergunta: { type: 'string', example: 'quais voos estao atrasados?' },
          historico: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['user', 'assistant'] },
                content: { type: 'string' },
              },
            },
          },
          voosContexto: { type: 'array', items: { type: 'object' } },
          modo: { type: 'string', enum: ['executivo', 'tecnico'], example: 'executivo' },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          usarLLM: { type: 'boolean', example: true },
        },
      },
      ChatResponse: {
        type: 'object',
        properties: {
          pergunta: { type: 'string' },
          resposta: { type: 'string' },
          topico: { type: 'string' },
          confianca: { type: 'string' },
          sugestoes: { type: 'array', items: { type: 'string' } },
          paginacao: { nullable: true, oneOf: [{ type: 'object' }, { type: 'null' }] },
          source: { type: 'string', example: 'llm' },
          provider: { type: 'string', nullable: true, example: 'openai' },
          model: { type: 'string', nullable: true, example: 'gpt-4o-mini' },
          totalVoosAvaliados: { type: 'integer', example: 21 },
        },
      },
    },
    examples: {
      RegisterRequestExample: {
        value: {
          nome: 'Operador Sistema',
          email: 'operador@aeroporto.com',
          senha: '123456',
          perfil: 'OPERADOR',
          companhia: null,
        },
      },
      LoginRequestExample: {
        value: {
          email: 'operador@aeroporto.com',
          senha: '123456',
        },
      },
      LoginResponseExample: {
        value: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          usuario: {
            id: 1,
            nome: 'Operador Sistema',
            email: 'operador@aeroporto.com',
            perfil: 'OPERADOR',
            companhia: null,
          },
        },
      },
      ErrorCredenciaisExample: {
        value: {
          error: 'Credenciais invalidas',
        },
      },
      ChangePasswordExample: {
        value: {
          currentPassword: '123456',
          newPassword: 'novaSenha123',
        },
      },
      TwoFaToggleExample: {
        value: {
          enabled: true,
        },
      },
      LgpdRequestExample: {
        value: {
          tipo: 'EXPORTACAO',
          detalhes: 'Quero copia dos dados pessoais.',
        },
      },
      VoosResponseExample: {
        value: [
          {
            numero_voo: 'LA1234',
            companhia: 'LATAM',
            horario_previsto: '2026-03-01T10:00:00.000Z',
            status: 'PREVISTO',
            preco_medio: '500.00',
          },
          {
            numero_voo: 'AZ5678',
            companhia: 'Azul',
            horario_previsto: '2026-03-01T15:30:00.000Z',
            status: 'EM_VOO',
            preco_medio: '450.00',
          },
        ],
      },
      RiscoResponseExample: {
        value: {
          numero_voo: 'LA1234',
          risco: {
            percent: 35,
            label: 'moderado',
          },
        },
      },
      ChatRequestExample: {
        value: {
          pergunta: 'quais voos estao atrasados agora?',
          historico: [],
          voosContexto: [],
          modo: 'executivo',
          page: 1,
          limit: 10,
          usarLLM: true,
        },
      },
      ChatResponseExample: {
        value: {
          pergunta: 'quais voos estao atrasados agora?',
          resposta: 'No momento, 2 voos estao com atraso provavel: AF0456 e BA0247.',
          topico: 'atrasos',
          confianca: 'alta',
          sugestoes: ['listar voos em atencao', 'mostrar companhias com mais atrasos'],
          paginacao: null,
          source: 'llm',
          provider: 'gemini',
          model: 'gemini-1.5-flash',
          totalVoosAvaliados: 21,
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastrar usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
              examples: {
                padrao: { $ref: '#/components/examples/RegisterRequestExample' },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuario cadastrado com sucesso' },
          400: { description: 'Dados invalidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Email ja cadastrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              examples: {
                padrao: { $ref: '#/components/examples/LoginRequestExample' },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login efetuado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
                examples: {
                  padrao: { $ref: '#/components/examples/LoginResponseExample' },
                },
              },
            },
          },
          401: {
            description: 'Credenciais invalidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                examples: {
                  padrao: { $ref: '#/components/examples/ErrorCredenciaisExample' },
                },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Dados do usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Perfil do usuario',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MeResponse' } } },
          },
          401: { description: 'Nao autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Alterar senha',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
              examples: {
                padrao: { $ref: '#/components/examples/ChangePasswordExample' },
              },
            },
          },
        },
        responses: {
          200: { description: 'Senha alterada' },
          400: { description: 'Dados invalidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Senha atual invalida', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/2fa': {
      get: {
        tags: ['Auth'],
        summary: 'Consultar status 2FA',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Status do 2FA',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TwoFaStatusResponse' } } },
          },
        },
      },
      post: {
        tags: ['Auth'],
        summary: 'Ativar ou desativar 2FA',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['enabled'],
                properties: { enabled: { type: 'boolean', example: true } },
              },
              examples: {
                padrao: { $ref: '#/components/examples/TwoFaToggleExample' },
              },
            },
          },
        },
        responses: {
          200: { description: '2FA atualizado' },
        },
      },
    },
    '/auth/sessions': {
      get: {
        tags: ['Auth'],
        summary: 'Listar sessoes ativas/recentes',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de sessoes',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionsResponse' } } },
          },
        },
      },
    },
    '/auth/sessions/{id}/revoke': {
      post: {
        tags: ['Auth'],
        summary: 'Revogar sessao por ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'Sessao revogada' },
          404: { description: 'Sessao nao encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/lgpd/request': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar solicitacao LGPD',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tipo'],
                properties: {
                  tipo: { type: 'string', enum: ['EXPORTACAO', 'EXCLUSAO'] },
                  detalhes: { type: 'string', nullable: true },
                },
              },
              examples: {
                padrao: { $ref: '#/components/examples/LgpdRequestExample' },
              },
            },
          },
        },
        responses: {
          201: { description: 'Solicitacao registrada' },
          400: { description: 'Tipo invalido', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/voos': {
      get: {
        tags: ['Voos'],
        summary: 'Listar voos operacionais',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de voos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Voo' },
                },
                examples: {
                  padrao: { $ref: '#/components/examples/VoosResponseExample' },
                },
              },
            },
          },
        },
      },
    },
    '/ia/risco-atraso/{numero_voo}': {
      get: {
        tags: ['IA'],
        summary: 'Calcular risco de atraso por voo',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'numero_voo',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'modelo',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['tradicional', 'generativa'] },
          },
        ],
        responses: {
          200: {
            description: 'Risco calculado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RiscoAtrasoResponse' },
                examples: {
                  padrao: { $ref: '#/components/examples/RiscoResponseExample' },
                },
              },
            },
          },
          404: { description: 'Voo nao encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/ia/chat': {
      post: {
        tags: ['IA'],
        summary: 'Chat IA operacional',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatRequest' },
              examples: {
                padrao: { $ref: '#/components/examples/ChatRequestExample' },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Resposta do assistente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatResponse' },
                examples: {
                  padrao: { $ref: '#/components/examples/ChatResponseExample' },
                },
              },
            },
          },
          400: { description: 'Pergunta obrigatoria', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
  },
};

module.exports = { openApiSpec };
