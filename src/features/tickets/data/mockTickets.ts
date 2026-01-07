import type { Ticket } from "../types/ticketTypes";

const TICKET_AVATARS: Record<string, string> = {
  "1": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTf0EDQTODg7aIfRjNG_0y3AS3dqGNWPNlJRA&s",
  "2": "https://i.pinimg.com/736x/27/57/78/2757784d2e6f5d047987321cf8d5bb89.jpg",
  "3": "https://favim.com/pd/s1/orig/160107/boy-icon-random-tumblr-Favim.com-3852801.jpg",
  "4": "https://img.wattpad.com/21bf8fcb4e0790256056b6cc1ad4943569479292/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f776174747061642d6d656469612d736572766963652f53746f7279496d6167652f354b3576414f686f516e4c3368673d3d2d3332383734303530362e313438383033353235653662663366313836333836383732303237302e6a7067?s=fit&w=720&h=720",
  "5": "https://img.wattpad.com/352372bbccb3b36a948d66714d46bf9244762adf/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f776174747061642d6d656469612d736572766963652f53746f7279496d6167652f71585571496b4d596663566f58673d3d2d3436353737393739392e313465313461353238343234356363393737323133323436363338342e6a7067",
};

// mocks são pra layout; depois você troca pelos dados da API
const BASE_TICKETS = [
  {
    id: "1",
    subject: "Erro ao acessar painel",
    status: "aberto",
    priority: "alta",
    requester: "João Silva",
    dateLabel: "12 Nov",
    entity: "anra",
  },
  {
    id: "2",
    subject: "Dúvida sobre cobrança",
    status: "pendente",
    priority: "media",
    requester: "Maria Oliveira",
    dateLabel: "10 Nov",
    entity: "aceam",
  },
  {
    id: "3",
    subject: "Solicitação de cancelamento",
    status: "fechado",
    priority: "baixa",
    requester: "Carlos Santos",
    dateLabel: "03 Nov",
    entity: "unob",
    type: "duvida",
  },
  {
    id: "4",
    subject: "Bug na tela de login",
    status: "aberto",
    priority: "alta",
    requester: "Ana Pereira",
    dateLabel: "Hoje",
    entity: "anra",
    type: "erro",
  },
  {
    id: "5",
    subject: "Sugestão de melhoria no chat",
    status: "pendente",
    priority: "media",
    requester: "Roberto Costa",
    dateLabel: "Ontem",
    entity: "aceam",
    type: "sugestao",
  },
] satisfies ReadonlyArray<Omit<Ticket, "avatarUrl">>;

export const mockTickets: Ticket[] = BASE_TICKETS.map((ticket) => ({
  ...ticket,
  avatarUrl: TICKET_AVATARS[ticket.id],
}));

export const mockEntities = [
  { id: "anra", name: "Anra" },
  { id: "aceam", name: "Aceam" },
  { id: "unob", name: "Unob" },
];
