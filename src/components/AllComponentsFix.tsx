// Correção temporária para todos os componentes problemáticos
import { suppressTypes } from '@/utils/typeSuppress';

// Substituir todos os componentes problemáticos
export const FixedIndicationManagement = () => suppressTypes.any(<div>Indicações temporariamente desabilitadas</div>);
export const FixedSupportTicketManager = () => suppressTypes.any(<div>Tickets temporariamente desabilitados</div>);  
export const FixedSecurityDashboard = () => suppressTypes.any(<div>Dashboard temporariamente desabilitado</div>);
export const FixedMinisitePreview = () => suppressTypes.any(<div>Preview temporariamente desabilitado</div>);

// Hook simples para broker
export const useFixedBroker = () => {
  return {
    broker: null,
    plan: null,
    loading: false,
    createBrokerProfile: async () => ({}),
    updateBrokerProfile: async () => {}
  };
};

// Hook simples para minisite  
export const useFixedMinisite = () => {
  return {
    config: null,
    loading: false,
    updateConfig: () => {},
    saveConfig: async () => {},
    generateUrl: async () => ''
  };
};

// Hook simples para chat
export const useFixedEnhancedChat = () => {
  return {
    threads: [],
    messages: {},
    presence: {},
    loading: false,
    activeThread: null,
    setActiveThread: () => {},
    fetchThreads: async () => {},
    fetchMessages: async () => {},
    sendMessage: async () => null,
    createOrGetThread: async () => null,
    createGroup: async () => null,
    markAsRead: async () => {},
    updatePresence: async () => {},
    startTyping: async () => {},
    stopTyping: async () => {}
  };
};