# 🎨 Guia de Marca - INOVAGUIL

## Identidade Visual Aplicada ao Sistema

### Cores Principais

#### Vermelho da Marca
- **Primário**: `#C8102E` - Vermelho vibrante e corporativo
- **Acentuado**: `#E31937` - Vermelho mais claro para hover
- **Uso**: Botões secundários, destaques, badges de alerta

#### Azul da Marca
- **Primário**: `#003DA5` - Azul profundo e confiável
- **Secundário**: `#1E73BE` - Azul mais claro para variações
- **Uso**: Headers, botões primários, navbars, backgrounds

#### Cores de Suporte
- **Fundo Principal**: `#F5F7FA` - Cinza neutro muito claro
- **Superfícies**: `#FFFFFF` - Branco puro para cards e containers
- **Texto Primário**: `#2C3E50` - Cinza escuro para leitura
- **Texto Secundário**: `#6C757D` - Cinza médio para informações menos importantes

### Estados Semânticos
- **Sucesso**: `#28A745` - Verde para confirmações
- **Aviso**: `#FFC107` - Amarelo para atenção
- **Erro**: `#DC3545` - Vermelho para problemas
- **Informação**: `#17A2B8` - Cyan para mensagens

### Elementos da Interface

#### Headers e Navegação
```
Gradiente: linear-gradient(135deg, #003DA5 0%, #C8102E 100%)
- Deixa a interface mais dinâmica
- Combina as duas cores principais
```

#### Botões Primários
```
Cor: #003DA5 (Azul)
Hover: Gradiente para vermelho (#C8102E)
Efeito: Sombra suave + elevação (translateY -2px)
```

#### Botões Secundários
```
Cor: #C8102E (Vermelho)
Hover: #E31937 (Vermelho acentuado)
Efeito: Sombra suave + elevação
```

#### Tabelas
```
Header: Gradiente azul-vermelho
Linhas: Hover com fundo muito claro
Bordas: Cinza neutro #E0E0E0
```

#### Cards e Containers
```
Fundo: #FFFFFF
Sombra: Padrão (4px 8px 0 rgba(0,0,0,0.1))
Border: 1px #E0E0E0 esquerda vermelha
```

### Tipografia
- **Font Stack**: System UI (Segoe UI, Roboto, etc.)
- **Weights**: Bold (títulos), Normal (corpo)
- **Tamanho**: 1em padrão, escala responsiva

### Sombras Padrão
- **Pequena**: `0 2px 4px rgba(0, 0, 0, 0.1)`
- **Média**: `0 4px 8px rgba(0, 0, 0, 0.1)`
- **Grande**: `0 8px 16px rgba(0, 0, 0, 0.15)`
- **Hover**: `0 4px 12px rgba(0, 0, 0, 0.15)`

### Raios de Borda
- **Pequeno**: 4px - inputs, badges
- **Médio**: 8px - botões, pequenos cards
- **Grande**: 12px - cards principais, headers

## Aplicação no Sistema

### Seções Coloridas por Status

#### Pendente
- Cor: `#FFC107` (Amarelo)
- Badge: Fundo amarelo + texto escuro
- Mensagem: "Aguardando atribuição"

#### Atribuído
- Cor: `#1E73BE` (Azul claro)
- Badge: Fundo azul + texto branco
- Mensagem: "Técnico designado"

#### Em Andamento
- Cor: `#003DA5` (Azul primário)
- Badge: Fundo azul + texto branco
- Indicador visual: Ativo/Em progresso

#### Concluído
- Cor: `#28A745` (Verde)
- Badge: Fundo verde + texto branco
- Ícone: Checkmark ou equivalente

#### Cancelado
- Cor: `#DC3545` (Vermelho/danger)
- Badge: Fundo vermelho + texto branco
- Ícone: X ou equivalente

## Componentes Estilizados

### Estrutura de Arquivos

```
frontend/src/
├── index.css              ← Variáveis CSS globais
├── theme.css              ← Estilos de tema aplicados
├── components/
│   ├── theme.js           ← Constantes JS de tema
│   ├── Admin/
│   ├── Technician/
│   └── Client/
└── App.js                 ← Importa theme.css e index.css
```

### Como Usar a Tema

#### Em CSS
```css
/* Use as variáveis CSS */
background: linear-gradient(135deg, var(--brand-blue) 0%, var(--brand-red) 100%);
color: var(--text-white);
```

#### Em JavaScript/JSX
```javascript
import { colors, buttonStyles } from './components/theme';

const myStyle = {
  background: colors.primary.blue,
  padding: colors.radius.md,
  boxShadow: colors.shadows.lg
};
```

## Componentes Pré-estilizados

### Classes CSS Disponíveis

| Classe | Propósito |
|--------|-----------|
| `.btn-primary` | Botão azul (ação primária) |
| `.btn-secondary` | Botão vermelho (ação secundária) |
| `.btn-delete` | Botão vermelho escuro (delete) |
| `.page-header` | Header com gradiente |
| `.card` | Card com sombra e border |
| `.table-container` | Tabela com tema aplicado |
| `.badge-*` | Badges de status |
| `.alert-*` | Alertas coloridos |
| `.text-primary` | Texto azul |
| `.text-danger` | Texto vermelho |

## Manutenção da Identidade Visual

### Checklist ao Adicionar Novos Componentes

- [ ] Use variáveis CSS do `:root`
- [ ] Aplique sombras padrão (não use sombras customizadas)
- [ ] Use raios de borda consistentes
- [ ] Botões primários com azul, secundários com vermelho
- [ ] Headers com gradiente azul-vermelho
- [ ] Hover states com elevação (transform translateY -2px)
- [ ] Padding/margin em múltiplos de 5px (5, 10, 15, 20, 25, 30)
- [ ] Fonts system UI padrão
- [ ] Contraste de cores >= 4.5:1 (WCAG AA)

### Mudança de Cores

Para mudar as cores da marca globalmente:

1. **Arquivo principal**: `frontend/src/index.css`
2. **Variáveis CSS**: `:root { --brand-red: ..., --brand-blue: ... }`
3. **Arquivo de tema**: `frontend/src/components/theme.js`
4. **CSS aplicado**: `frontend/src/theme.css`

Todas as mudanças se propagarão automaticamente em toda a aplicação.

## Referências de Design

- **Espaçamento**: Escala 4-8-12-16-20-24-32
- **Tipografia**: 12px, 14px, 16px, 18px, 24px, 32px
- **Breakpoints responsivos**: 320px, 768px, 1024px, 1440px
- **Tempo de animação**: 0.3s (transições suaves)

---

**Última atualização**: Janeiro 27, 2026
**Status**: ✅ Aplicada em toda a interface
