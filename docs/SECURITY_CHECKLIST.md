# =============================================================================

# CHECKLIST DE SEGURANÇA PARA PRODUÇÃO

# =============================================================================

## ✅ Variáveis de Ambiente

- [ ] `.env.production` criado e configurado
- [ ] Arquivo `.env.production` NÃO está no Git
- [ ] Todas as secrets são strings fortes e aleatórias
- [ ] `CRON_SECRET` gerado com `openssl rand -base64 32`
- [ ] Firebase Private Key está correto e escapado
- [ ] Database URL usa SSL/TLS (`?sslmode=require`)
- [ ] URLs públicas usam HTTPS

## 🔒 Autenticação & Autorização

- [ ] Firebase Authentication configurado corretamente
- [ ] Regras de segurança do Firestore implementadas
- [ ] Middleware de autenticação ativo em rotas protegidas
- [ ] Rate limiting implementado (Upstash Redis)
- [ ] Session tokens têm tempo de expiração adequado

## 🗄️ Banco de Dados

- [ ] Migrações do Prisma executadas
- [ ] Connection pooling configurado (PgBouncer)
- [ ] Backup automático configurado
- [ ] Índices de performance criados
- [ ] Row Level Security (RLS) configurado se aplicável

## 🌐 CORS & Headers

- [ ] CORS configurado apenas para domínios necessários
- [ ] Security headers configurados:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security`
  - `Referrer-Policy`
  - `Permissions-Policy`

## 📦 Dependencies

- [ ] Executar `pnpm audit` e resolver vulnerabilidades críticas
- [ ] Dependências atualizadas para versões estáveis
- [ ] `package.json` usa versões fixas (não `^` ou `~`)
- [ ] GitHub Dependabot ativado

## 🔐 Secrets & Keys

- [ ] Nenhuma secret hardcoded no código
- [ ] `.env.example` não contém valores reais
- [ ] Secrets rotacionadas periodicamente
- [ ] Acesso a secrets limitado (princípio do menor privilégio)
- [ ] Firebase Service Account tem permissões mínimas

## 📤 Upload de Arquivos

- [ ] Validação de tipo de arquivo (whitelist)
- [ ] Validação de tamanho máximo
- [ ] Nomes de arquivo sanitizados
- [ ] Arquivos armazenados fora do webroot
- [ ] Signed URLs para acesso temporário
- [ ] Antivírus/malware scanning se aplicável

## 🌍 Rede & Infraestrutura

- [ ] SSL/TLS configurado (Let's Encrypt)
- [ ] Certificado válido e não expira em breve
- [ ] HTTPS forçado (redirect HTTP → HTTPS)
- [ ] Firewall configurado (apenas portas necessárias)
- [ ] DDoS protection ativo (Cloudflare/similar)

## 📊 Monitoramento & Logs

- [ ] Sentry configurado e testado
- [ ] Logs sensíveis NÃO contêm secrets
- [ ] Health check endpoint funcionando
- [ ] Alertas configurados para erros críticos
- [ ] Log rotation configurado

## 🚀 Deploy & CI/CD

- [ ] Deploy automático apenas de branches específicas
- [ ] Testes passando antes do deploy
- [ ] Rollback strategy definida
- [ ] Zero-downtime deployment configurado
- [ ] Staging environment disponível

## 💾 Backup & Recuperação

- [ ] Backup automático do banco de dados
- [ ] Backup de arquivos (S3/R2)
- [ ] Testes de restore realizados
- [ ] Disaster recovery plan documentado
- [ ] Backup offsite/cross-region

## ⚡ Performance

- [ ] Next.js output: standalone configurado
- [ ] Imagens otimizadas (next/image)
- [ ] Assets estáticos com cache longo
- [ ] Gzip/Brotli compression ativo
- [ ] Database queries otimizadas
- [ ] CDN configurado (Cloudflare)

## 📱 API Security

- [ ] Rate limiting em todas as APIs públicas
- [ ] Input validation em todos os endpoints
- [ ] Output encoding para prevenir XSS
- [ ] SQL Injection prevenida (Prisma ORM)
- [ ] CSRF protection ativo

## 👥 Acesso & Permissões

- [ ] Princípio do menor privilégio aplicado
- [ ] MFA ativo para contas administrativas
- [ ] Logs de auditoria para ações sensíveis
- [ ] Revisão periódica de acessos
- [ ] Procedimento de revogação documentado

## 📋 Compliance & Legal

- [ ] LGPD/GDPR compliance verificada
- [ ] Termos de uso atualizados
- [ ] Política de privacidade publicada
- [ ] Cookie consent implementado
- [ ] Data retention policy definida

## 🧪 Testes de Segurança

- [ ] Penetration testing realizado
- [ ] OWASP Top 10 verificado
- [ ] Dependency scanning ativo
- [ ] Code scanning (SAST) configurado
- [ ] Security headers testados (securityheaders.com)

## 🔄 Manutenção Contínua

- [ ] Plano de atualização de dependências
- [ ] Security patches aplicados regularmente
- [ ] Revisão de logs periódica
- [ ] Testes de segurança agendados
- [ ] Documentação atualizada

---

## 🚨 Ações Imediatas Antes do Deploy

1. ✅ Executar `pnpm audit --audit-level=high`
2. ✅ Verificar todas as variáveis de ambiente
3. ✅ Testar health check endpoint
4. ✅ Verificar SSL/TLS
5. ✅ Testar backup e restore
6. ✅ Verificar logs do Sentry
7. ✅ Testar rate limiting
8. ✅ Verificar cron jobs

---

## 📞 Contatos de Emergência

- **DevOps:** [email/telefone]
- **Security Team:** [email/telefone]
- **Database Admin:** [email/telefone]
- **On-call:** [número/slack]

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Firebase Security](https://firebase.google.com/docs/rules)
