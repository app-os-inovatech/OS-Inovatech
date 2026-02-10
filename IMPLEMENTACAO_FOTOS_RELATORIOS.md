# Implementação de Fotos de Equipamentos nos Relatórios

## Resumo das Mudanças

### Backend - Campos Adicionados à Tabela `relatorios_diarios`

Os seguintes campos foram adicionados para capturar fotos dos equipamentos durante o relatório:

1. **PHU (Plataforma de Aquecimento Unitária)**
   - `foto_phu` - Foto da PHU
   - `foto_numero_serie_phu` - Foto do número de série da PHU
   - `foto_temperatura_phu` - Foto das temperaturas da PHU

2. **Microondas**
   - `foto_microondas` - Foto do microondas
   - `foto_numero_serie_microondas` - Foto do número de série do microondas

3. **Fritadeira**
   - `foto_cuba_1_fritadeira` - Foto da cuba 1 da fritadeira
   - `foto_numero_serie_cuba_1_fritadeira` - Foto do número de série da cuba 1
   - `foto_cuba_2_fritadeira` - Foto da cuba 2 da fritadeira
   - `foto_numero_serie_cuba_2_fritadeira` - Foto do número de série da cuba 2
   - `foto_cuba_3_fritadeira` - Foto da cuba 3 da fritadeira
   - `foto_numero_serie_cuba_3_fritadeira` - Foto do número de série da cuba 3

4. **Broiler**
   - `foto_broiler` - Foto do Broiler
   - `foto_temperatura_broiler` - Foto da temperatura do Broiler
   - `foto_pressao_alta_broiler` - Foto da pressão alta do Broiler
   - `foto_pressao_baixa_broiler` - Foto da pressão baixa do Broiler
   - `foto_numero_serie_broiler` - Foto do número de série do Broiler

### Validações Implementadas

- Todas as 16 fotos são **obrigatórias** ao criar um relatório
- O servidor retorna erro 400 se alguma foto estiver faltando
- Mensagem clara: "Todas as fotos dos equipamentos são obrigatórias"

### Estrutura da Requisição POST

```json
{
  "agendamento_id": 1,
  "loja_id": 1,
  "check_in": "2026-01-27T09:00:00",
  "check_out": "2026-01-27T12:00:00",
  "relato_execucao": "Serviço realizado com sucesso",
  "fotos": [],
  "loja_nome": "Loja X",
  "tipo_servico": "Manutenção",
  "checkin_latitude": -23.5505,
  "checkin_longitude": -46.6333,
  "checkout_latitude": -23.5505,
  "checkout_longitude": -46.6333,
  
  // Fotos obrigatórias
  "foto_phu": "/path/to/phu.jpg",
  "foto_numero_serie_phu": "/path/to/phu_serial.jpg",
  "foto_temperatura_phu": "/path/to/phu_temp.jpg",
  "foto_microondas": "/path/to/microwave.jpg",
  "foto_numero_serie_microondas": "/path/to/microwave_serial.jpg",
  "foto_cuba_1_fritadeira": "/path/to/fryer_1.jpg",
  "foto_numero_serie_cuba_1_fritadeira": "/path/to/fryer_1_serial.jpg",
  "foto_cuba_2_fritadeira": "/path/to/fryer_2.jpg",
  "foto_numero_serie_cuba_2_fritadeira": "/path/to/fryer_2_serial.jpg",
  "foto_cuba_3_fritadeira": "/path/to/fryer_3.jpg",
  "foto_numero_serie_cuba_3_fritadeira": "/path/to/fryer_3_serial.jpg",
  "foto_broiler": "/path/to/broiler.jpg",
  "foto_temperatura_broiler": "/path/to/broiler_temp.jpg",
  "foto_pressao_alta_broiler": "/path/to/broiler_pressure_high.jpg",
  "foto_pressao_baixa_broiler": "/path/to/broiler_pressure_low.jpg",
  "foto_numero_serie_broiler": "/path/to/broiler_serial.jpg"
}
```

## O que Falta no Frontend

O frontend precisa ser atualizado para:

1. **Adicionar campos de upload de fotos** para cada um dos 16 equipamentos/medições
2. **Capturar fotos da câmera** ou permitir seleção de arquivos
3. **Validar que todas as fotos foram capturadas** antes de enviar o formulário
4. **Enviar as fotos para o servidor** como strings (caminhos) ou base64

## Arquivos Modificados

- ✅ [backend/scripts/migrate-relatorios-fotos.js](../scripts/migrate-relatorios-fotos.js) - Script de migração (novo)
- ✅ [backend/src/controllers/relatorioDiarioController.js](../src/controllers/relatorioDiarioController.js) - Controlador atualizado

## Próximos Passos

1. Atualizar o formulário do frontend para capturar as 16 fotos
2. Implementar upload/armazenamento das fotos
3. Atualizar o componente de visualização de relatórios para exibir as novas fotos
4. Testar o fluxo completo end-to-end
