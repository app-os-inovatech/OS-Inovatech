// Tema e estilos da marca INOVAGUIL
export const colors = {
  primary: {
    red: '#C8102E',
    blue: '#003DA5',
    darkBlue: '#003DA5',
    lightBlue: '#1E73BE',
    accentRed: '#E31937'
  },
  neutral: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    textPrimary: '#2C3E50',
    textSecondary: '#6C757D',
    textLight: '#FFFFFF',
    border: '#E0E0E0',
    disabled: '#F0F0F0'
  },
  states: {
    success: '#28A745',
    warning: '#FFC107',
    danger: '#DC3545',
    info: '#17A2B8'
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
    hover: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  }
};

// Estilos padrão para botões
export const buttonStyles = {
  primary: {
    background: colors.primary.blue,
    color: colors.neutral.textLight,
    padding: '10px 20px',
    border: 'none',
    borderRadius: colors.radius.md,
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: colors.shadows.sm,
    '&:hover': {
      background: colors.primary.red,
      boxShadow: colors.shadows.hover,
      transform: 'translateY(-2px)'
    }
  },
  secondary: {
    background: colors.primary.red,
    color: colors.neutral.textLight,
    padding: '10px 20px',
    border: 'none',
    borderRadius: colors.radius.md,
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: colors.shadows.sm,
    '&:hover': {
      background: colors.primary.accentRed,
      boxShadow: colors.shadows.hover,
      transform: 'translateY(-2px)'
    }
  },
  success: {
    background: colors.states.success,
    color: colors.neutral.textLight,
    padding: '10px 20px',
    border: 'none',
    borderRadius: colors.radius.md,
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: colors.shadows.sm
  },
  danger: {
    background: colors.states.danger,
    color: colors.neutral.textLight,
    padding: '10px 20px',
    border: 'none',
    borderRadius: colors.radius.md,
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: colors.shadows.sm
  }
};

// Estilos padrão para cards/containers
export const cardStyles = {
  default: {
    background: colors.neutral.surface,
    borderRadius: colors.radius.lg,
    padding: '20px',
    boxShadow: colors.shadows.md,
    border: `1px solid ${colors.neutral.border}`
  },
  withBorder: {
    background: colors.neutral.surface,
    borderRadius: colors.radius.lg,
    padding: '20px',
    boxShadow: colors.shadows.md,
    borderLeft: `4px solid ${colors.primary.red}`
  }
};

// Estilos padrão para headers
export const headerStyles = {
  primary: {
    background: `linear-gradient(135deg, ${colors.primary.blue} 0%, ${colors.primary.red} 100%)`,
    color: colors.neutral.textLight,
    padding: '20px',
    borderRadius: colors.radius.md,
    boxShadow: colors.shadows.md
  },
  secondary: {
    background: colors.primary.red,
    color: colors.neutral.textLight,
    padding: '20px',
    borderRadius: colors.radius.md,
    boxShadow: colors.shadows.md
  }
};

// Estilos padrão para tabelas
export const tableStyles = {
  header: {
    background: colors.primary.blue,
    color: colors.neutral.textLight,
    padding: '12px',
    fontWeight: 'bold'
  },
  row: {
    borderBottom: `1px solid ${colors.neutral.border}`,
    padding: '12px'
  },
  hover: {
    background: colors.primary.lightBlue + '15'
  }
};

// Funções utilitárias
export const getStatusColor = (status) => {
  const statusColors = {
    'pendente': colors.states.warning,
    'atribuido': colors.primary.lightBlue,
    'em_andamento': colors.primary.blue,
    'concluido': colors.states.success,
    'cancelado': colors.states.danger
  };
  return statusColors[status] || colors.neutral.textSecondary;
};

export const getStatusLabel = (status) => {
  const labels = {
    'pendente': 'Pendente',
    'atribuido': 'Atribuído',
    'em_andamento': 'Em Andamento',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado'
  };
  return labels[status] || status;
};

export default {
  colors,
  buttonStyles,
  cardStyles,
  headerStyles,
  tableStyles,
  getStatusColor,
  getStatusLabel
};
