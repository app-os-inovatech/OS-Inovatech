# Sistema de Despesas com Pasta Automática

## Funcionalidade

Quando um técnico lança uma despesa na aba "Despesas", o sistema cria automaticamente:

1. **Pasta com Data e Identificação**: `YYYY-MM-DD_NomeTecnico_Loja`
2. **Subpasta "fotos"**: Contém todas as fotos/comprovantes da despesa
3. **Arquivo Excel**: `despesa_detalhes.xlsx` com todos os dados

## Estrutura de Pastas

```
C:\admin_despesas\
├── 2026-01-26_Alessandro_Loja_Centro\
│   ├── fotos\
│   │   ├── foto_1.jpg (comprovante)
│   │   ├── foto_2.jpg
│   │   ├── foto_3.jpg
│   │   └── ...
│   └── despesa_detalhes.xlsx
├── 2026-01-26_Pedro_Loja_Shopping\
│   ├── fotos\
│   │   ├── foto_1.jpg
│   │   └── ...
│   └── despesa_detalhes.xlsx
└── ...
```

## Configuração

### 1. Edite o arquivo `.env` no backend

```env
# Caminho da pasta de administrador onde as despesas serão salvas
ADMIN_FOLDER=C:\admin_despesas
```

Se deixar em branco, a pasta padrão será `C:\admin_despesas`

### 2. Certifique-se de que a pasta existe

A pasta será criada automaticamente se não existir.

## O que é Incluído na Planilha Excel

A planilha `despesa_detalhes.xlsx` contém:

| Campo | Valor |
|-------|-------|
| ID Despesa | ID único da despesa |
| Técnico | Nome do técnico que lançou |
| Loja | Nome da loja |
| Categoria | Categoria da despesa |
| Descrição | Descrição detalhada |
| Valor | Valor em R$ |
| Data da Despesa | Data e hora do lançamento |
| Status | Status (Pendente, Aprovada, etc) |
| Comprovante | Nome do arquivo de comprovante |
| Observações | Observações adicionais |

## Fluxo de Uso

1. **Técnico acessa a aba "Despesas"**
2. **Preenche os dados:**
   - Categoria
   - Descrição
   - Valor
   - Loja
   - Comprovante (foto obrigatória)
   - Fotos adicionais (opcional)

3. **Clica em "Lançar Despesa"**
4. **Automaticamente:**
   - Despesa é salva no banco de dados
   - Pasta é criada no `ADMIN_FOLDER`
   - Todas as fotos são salvas na subpasta "fotos"
   - Planilha Excel é gerada com os detalhes

5. **Admin acessa C:\admin_despesas para revisar**

## Recuperação de Planilhas Anteriores

Se precisar gerar um relatório consolidado de todas as despesas:

- Há uma função `criarRelatorioDespesas()` que pode ser chamada manualmente
- Cria um arquivo `despesas_consolidadas.xlsx` com todos os registros

## Estrutura de Arquivo Salvo

### Fotos Salvas

```
- foto_1.jpg (comprovante original)
- foto_2.jpg (primeira foto adicional)
- foto_3.jpg (segunda foto adicional)
- ...
```

As fotos são salvas em JPEG com qualidade máxima.

### Informações na Planilha

- Dados de identificação da despesa
- Informações do técnico
- Detalhes da loja
- Comprovante de valor
- Rastreabilidade completa

## Troubleshooting

### Pasta não está sendo criada

1. Verifique se o caminho em `.env` está correto
2. Confirme se a pasta raiz existe e tem permissão de escrita
3. Verifique os logs do servidor para mensagens de erro

### Fotos não estão sendo salvas

1. Certifique-se de que as fotos foram selecionadas no formulário
2. Verifique o tamanho das fotos (não deve exceder limite de memória)
3. Verifique espaço em disco disponível

### Planilha não está sendo criada

1. ExcelJS pode não estar instalado: `npm install exceljs`
2. Verifique permissões de escrita na pasta
3. Verifique os logs do console do backend

## Segurança

- As pastas criadas seguem a convenção `YYYY-MM-DD_NomeTecnico_Loja`
- Todos os caracteres inválidos são substituídos por `_`
- As fotos são armazenadas com padrão de nomenclatura sequencial
- Nenhum dados sensível é armazenado em texto plano (senhas não são incluídas)

## Performance

- Criação de pasta é assíncrona (não bloqueia a requisição)
- Fotos são processadas em paralelo
- Planilha é gerada apenas uma vez por despesa
