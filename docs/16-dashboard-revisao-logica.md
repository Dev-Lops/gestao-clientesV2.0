# Revisão do Dashboard

## Visão geral
- **Fonte de dados:** API `/api/dashboard` agora delega ao `getDashboardData` para garantir a mesma lógica usada no servidor e no client.
- **Contagem fiel:** KPI de clientes e tarefas usa contagens completas (`client.count` / `task.count`), preservando listagens limitadas para o preview.
- **Finanças:** Agrupamento mensal usa uma única consulta de transações com filtragem local (últimos 6 meses) evitando consultas sequenciais.
- **Autenticação:** Falhas retornam 401 com cabeçalhos de segurança aplicados pelo helper compartilhado.

## Pontos verificados
- Normalização de status de tarefas para enum atual antes de agregações.
- Urgência calculada apenas para itens não concluídos e com due date.
- Eventos, tarefas e reuniões filtrados por mês selecionado para o calendário.

## Próximos ajustes sugeridos
- Expandir a paginação das tarefas/ clientes exibidas no dashboard (atualmente `take: 200` / `take: 50`) para refletir totalmente as listas em métricas derivadas (ex.: taxa de conclusão por cliente).
- Adicionar métricas financeiras derivadas (ticket médio, inadimplência) se os dados estiverem disponíveis.
