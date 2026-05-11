# cinetpay-js

SDK JavaScript/TypeScript universel pour l'API CinetPay v1 — paiements et transferts mobile money en Afrique.

## Caractéristiques

- **Multi-pays natif** : credentials `api_key` / `api_password` par pays, chaque pays a son propre token JWT isolé
- **Universel** : fonctionne dans Node.js 18+, Deno, Bun, et tous les frameworks (Next.js, Nuxt, Express, Fastify, Hono, etc.)
- **TypeScript-first** : types complets, autocomplétion dans votre IDE
- **Zéro dépendance** : utilise `fetch` natif uniquement
- **Dual output** : ESM (`import`) + CJS (`require`)
- **Sécurisé** : HTTPS obligatoire, credentials protégés contre la sérialisation, avertissement si utilisé côté navigateur
- **Token auto-refresh** : retry automatique si le token JWT expire en cours de session
- **Validation** : toutes les données sont validées localement avant envoi (montants, URLs, emails, téléphones, enums)
- **Logging** : système de logs injectable (désactivé par défaut, activable via `debug: true` ou logger custom)
- **IPv4** : option `forceIPv4` pour résoudre les problèmes DNS IPv6

## Environnements

| Environnement | URL de base | Préfixe clé API | Usage |
|---------------|-------------|-----------------|-------|
| **Sandbox** | `https://api.cinetpay.net` | `sk_test_...` | Tests et développement |
| **Production** | `https://api.cinetpay.co` | `sk_live_...` | Transactions réelles |

Le SDK **détecte automatiquement** l'environnement à partir du préfixe de vos clés API :

```typescript
// Sandbox — auto-détecté via sk_test_, pointe vers api.cinetpay.net
const client = new CinetPayClient({
  credentials: {
    CI: { apiKey: 'sk_test_abc123', apiPassword: '...' },
  },
})

// Production — auto-détecté via sk_live_, pointe vers api.cinetpay.co
const client = new CinetPayClient({
  credentials: {
    CI: { apiKey: 'sk_live_xyz789', apiPassword: '...' },
  },
})

// Vous pouvez aussi forcer le baseUrl explicitement
const client = new CinetPayClient({
  credentials: { ... },
  baseUrl: 'https://api.cinetpay.co',
})
```

### Protections

Le SDK émet des **erreurs dans les logs** si :
- Vous mélangez des clés `sk_test_` et `sk_live_` entre différents pays
- Vous utilisez une clé `sk_test_` avec l'URL de production (ou inversement)
- Votre clé ne commence ni par `sk_test_` ni par `sk_live_`

## Installation

```bash
npm install cinetpay-js
```

```bash
yarn add cinetpay-js
```

```bash
pnpm add cinetpay-js
```

## Démarrage rapide

```typescript
import { CinetPayClient } from 'cinetpay-js'

const client = new CinetPayClient({
  credentials: {
    CI: {
      apiKey: process.env.CINETPAY_API_KEY_CI!,
      apiPassword: process.env.CINETPAY_API_PASSWORD_CI!,
    },
    SN: {
      apiKey: process.env.CINETPAY_API_KEY_SN!,
      apiPassword: process.env.CINETPAY_API_PASSWORD_SN!,
    },
  },
})
```

## API

### Paiement web

#### Initialiser un paiement

```typescript
const payment = await client.payment.initialize({
  currency: 'XOF',
  merchantTransactionId: 'ORDER-001',
  amount: 1000,
  lang: 'fr',
  designation: 'Achat en ligne',
  clientEmail: 'client@email.com',
  clientFirstName: 'Jean',
  clientLastName: 'Dupont',
  clientPhoneNumber: '+2250707000000',
  successUrl: 'https://monsite.com/success',
  failedUrl: 'https://monsite.com/failed',
  notifyUrl: 'https://monsite.com/webhook',
  channel: 'PUSH',
}, 'CI')

// Rediriger le client vers la page de paiement
if (payment.details.mustBeRedirected) {
  redirect(payment.paymentUrl)
}
```

#### Paiement direct (sans redirection)

```typescript
const payment = await client.payment.initialize({
  currency: 'XOF',
  merchantTransactionId: 'ORDER-002',
  amount: 500,
  lang: 'fr',
  designation: 'Achat direct',
  clientEmail: 'client@email.com',
  clientFirstName: 'Jean',
  clientLastName: 'Dupont',
  clientPhoneNumber: '+2250707000000',
  successUrl: 'https://monsite.com/success',
  failedUrl: 'https://monsite.com/failed',
  notifyUrl: 'https://monsite.com/webhook',
  channel: 'PUSH',
  directPay: true,
  otpCode: '1234',        // Code OTP fourni par le client (Orange Money)
  paymentMethod: 'OM_CI', // Méthode de paiement spécifique
}, 'CI')

// Vérifier le statut dans payment.details.status
// SUCCESS | FAILED | INITIATED | PENDING
```

#### Vérifier le statut d'un paiement

```typescript
// Par payment_token, transaction_id ou merchant_transaction_id
const status = await client.payment.getStatus('ORDER-001', 'CI')

console.log(status.status)  // 'SUCCESS' | 'FAILED' | 'PENDING' | ...
console.log(status.user)    // { name, email, phoneNumber }
```

### Transfert d'argent

#### Effectuer un transfert

```typescript
const transfer = await client.transfer.create({
  currency: 'XOF',
  merchantTransactionId: 'TRANSFER-001',
  phoneNumber: '+2250707000001',
  amount: 500,
  paymentMethod: 'OM_CI',
  reason: 'Remboursement client',
  notifyUrl: 'https://monsite.com/webhook-transfer',
}, 'CI')

console.log(transfer.status)        // 'PENDING' | 'SUCCESS'
console.log(transfer.transactionId) // ID CinetPay
```

#### Vérifier le statut d'un transfert

```typescript
const status = await client.transfer.getStatus('dc1f6d3d-432f-...', 'CI')
```

### Solde du compte

```typescript
const balance = await client.balance.get('CI')
console.log(balance.availableBalance) // "249711.74"
console.log(balance.currency)         // "XOF"
```

### Webhooks (notifications)

CinetPay envoie une notification POST à votre `notifyUrl` quand une transaction atteint un statut final (SUCCESS ou FAILED).

```typescript
import { parseNotification, verifyNotification } from 'cinetpay-js'

// Dans votre endpoint webhook (Express, Fastify, Next.js, etc.)
app.post('/webhook', async (req, res) => {
  // 1. Parser la notification
  const notification = parseNotification(req.body)

  // 2. Vérifier le token (comparaison timing-safe)
  const expectedToken = getStoredNotifyToken(notification.merchantTransactionId)
  if (!verifyNotification(expectedToken, notification.notifyToken)) {
    return res.status(401).send('Invalid token')
  }

  // 3. Protection anti-replay : vérifier que cette notification n'a pas déjà été traitée
  if (await isAlreadyProcessed(notification.transactionId)) {
    return res.status(200).send('Already processed')
  }

  // 4. Confirmer le statut auprès de CinetPay
  const status = await client.payment.getStatus(
    notification.transactionId,
    'CI',
  )

  if (status.status === 'SUCCESS') {
    // Valider la commande
    await markAsProcessed(notification.transactionId)
  }

  res.status(200).send('OK')
})
```

> **Protection anti-replay** : un webhook valide intercepté peut être rejoué.
> Stockez toujours les `transactionId` déjà traités (en base de données) et ignorez les doublons.
> Cela empêche qu'un attaquant rejoue un webhook de paiement confirmé pour déclencher
> une double livraison ou un double crédit.

### Vérifier si un statut est final

```typescript
import { isFinalStatus } from 'cinetpay-js'

isFinalStatus('SUCCESS')             // true
isFinalStatus('FAILED')              // true
isFinalStatus('PENDING')             // false
isFinalStatus('TRANSACTION_EXIST')   // true
isFinalStatus('INSUFFICIENT_BALANCE') // true
```

## Configuration

```typescript
import { CinetPayClient, MemoryTokenStore } from 'cinetpay-js'

const client = new CinetPayClient({
  // Credentials par pays (obligatoire)
  credentials: {
    CI: { apiKey: '...', apiPassword: '...' },
    SN: { apiKey: '...', apiPassword: '...' },
    CM: { apiKey: '...', apiPassword: '...' },
  },

  // URL de base de l'API (défaut: https://api.cinetpay.net)
  baseUrl: 'https://api.cinetpay.net',

  // TTL du cache token en secondes (défaut: 82800 = 23h)
  tokenTtl: 82800,

  // Timeout des requêtes en ms (défaut: 30000)
  timeout: 30000,

  // Store de tokens personnalisé (défaut: MemoryTokenStore)
  tokenStore: new MemoryTokenStore(),

  // Force la résolution DNS en IPv4 (défaut: false)
  forceIPv4: true,

  // Active les logs console (défaut: false)
  debug: true,

  // Ou un logger personnalisé (prend priorité sur debug)
  // logger: myCustomLogger,
})
```

### TokenStore personnalisé (Redis, etc.)

```typescript
import { TokenStore } from 'cinetpay-js'
import Redis from 'ioredis'

class RedisTokenStore implements TokenStore {
  private redis = new Redis()

  async get(key: string): Promise<string | null> {
    return this.redis.get(key)
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, value)
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key)
  }
}

const client = new CinetPayClient({
  credentials: { CI: { apiKey: '...', apiPassword: '...' } },
  tokenStore: new RedisTokenStore(),
})
```

## Validation des données

Le SDK valide **toutes les données localement** avant d'envoyer la requête à l'API. Cela donne des messages d'erreur clairs et immédiats, sans attendre un aller-retour réseau.

| Champ | Règle |
|---|---|
| `currency` | Doit être XOF, XAF, GNF, CDF ou USD |
| `amount` (paiement) | 100 - 2 500 000, nombre entier fini |
| `amount` (transfert) | 100 - 1 500 000 |
| `merchantTransactionId` | 1-30 caractères |
| `successUrl/failedUrl/notifyUrl` | 1-120 caractères, doit commencer par `http://` ou `https://` |
| `clientFirstName/LastName` | 2-255 caractères |
| `clientEmail` | Format email valide |
| `clientPhoneNumber` | Format international `+XXXXXXXXXXXX` |
| `otpCode` | 4-6 chiffres |
| `channel` | PUSH, OTP ou QRCODE |
| `paymentMethod` | Un des 26 opérateurs reconnus |
| `directPay: true` | Exige `clientPhoneNumber` et `paymentMethod` |

```typescript
import { ValidationError } from 'cinetpay-js'

try {
  await client.payment.initialize({ amount: -5, ... }, 'CI')
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.message)
    // "[amount] must be an integer between 100 and 2500000 (got -5)"
  }
}
```

## Logging

Le SDK intègre un système de logs à 3 niveaux, **désactivé par défaut**.

### Activation rapide

```typescript
const client = new CinetPayClient({
  credentials: { ... },
  debug: true, // Logs dans la console avec préfixe [cinetpay]
})
```

### Logger personnalisé (Winston, Pino, etc.)

```typescript
import type { Logger } from 'cinetpay-js'
import pino from 'pino'

const pinoInstance = pino()

const logger: Logger = {
  debug: (msg, data) => pinoInstance.debug(data, msg),
  warn:  (msg, data) => pinoInstance.warn(data, msg),
  error: (msg, data) => pinoInstance.error(data, msg),
}

const client = new CinetPayClient({
  credentials: { ... },
  logger,
})
```

### Ce qui est loggé

| Niveau | Contenu |
|---|---|
| `debug` | Requêtes HTTP (method, path, body sanitisé), réponses (code, status), cache token hit/miss |
| `warn` | Renouvellement de token expiré, détection environnement navigateur |
| `error` | Erreurs API (code, status, description), timeouts, erreurs réseau |

Les mots de passe (`api_password`) sont **toujours remplacés par `***`** dans les logs.

## Résolution DNS IPv4

Certains serveurs ont des problèmes de connectivité IPv6 avec l'API CinetPay. L'option `forceIPv4` force la résolution DNS en IPv4 (équivalent de `force_ip_resolve => 'v4'` dans Guzzle/PHP).

```typescript
const client = new CinetPayClient({
  credentials: { ... },
  forceIPv4: true,
})
```

- **Node.js 16.4+** : utilise `dns.setDefaultResultOrder('ipv4first')`
- **Navigateurs / Deno / Bun** : ignoré (le DNS est géré par l'OS)

## Sécurité

### Credentials protégés

Les clés API (`api_key`, `api_password`) sont stockées dans des **champs privés ES2022** (`#privateField`). Elles ne sont **jamais** exposées via :

- `JSON.stringify(client)` : retourne `{ countries: ['CI', 'SN'] }` uniquement
- `JSON.stringify(authenticator)` : retourne `{ country: 'CI', cacheKey: '...' }` uniquement
- `console.log()` / `Object.keys()` / `for...in` : les credentials sont invisibles
- Accès direct : `client.authenticators` est `private`, inaccessible depuis l'extérieur

### HTTPS obligatoire

Le SDK **refuse** de s'initialiser si le `baseUrl` n'utilise pas `https://` (sauf `localhost` / `127.0.0.1` pour le développement).

### Avertissement navigateur

Si le SDK détecte un environnement navigateur (`window` + `document`), il émet un **warning** dans la console. Les credentials ne doivent **jamais** être exposés côté client.

### Bonnes pratiques

```
NE FAITES PAS                           FAITES
----------------------------------------------------------------------------------------------------------
apiKey: 'clé-en-dur'                    apiKey: process.env.CINETPAY_API_KEY_CI!
Utiliser côté client (React, Vue)       Utiliser côté serveur (API route, serverless)
Stocker les clés dans le code           Utiliser .env / secrets manager
Loguer l'objet client                   Loguer uniquement client.countries()
```

### Révocation de tokens

En cas de compromission ou de rotation des credentials, révoquez les tokens en cache :

```typescript
// Révoquer le token d'un pays
await client.revokeToken('CI')

// Révoquer tous les tokens
await client.revokeAllTokens()
```

### Protection SSRF

Le SDK émet un warning si le `baseUrl` ne pointe pas vers un domaine CinetPay connu (`api.cinetpay.net`, `api.cinetpay.co`). Cela protège contre les redirections vers des services internes.

### Webhook : toujours vérifier

1. **Vérifiez le `notify_token`** avec `verifyNotification()` (comparaison timing-safe)
2. **Protégez-vous du replay** : stockez les `transactionId` déjà traités et ignorez les doublons
3. **Confirmez le statut** en appelant `client.payment.getStatus()` ou `client.transfer.getStatus()`
4. Ne faites **jamais** confiance au body du webhook seul

## Constantes disponibles

### Devises

| Code | Description |
|------|-------------|
| `XOF` | Franc CFA BCEAO (Afrique de l'Ouest) |
| `XAF` | Franc CFA BEAC (Afrique Centrale) |
| `GNF` | Franc guinéen |
| `CDF` | Franc congolais |
| `USD` | Dollar américain |

### Méthodes de paiement par pays

| Pays | Code | Opérateurs |
|------|------|------------|
| Côte d'Ivoire | `CI` | `OM_CI`, `MOOV_CI`, `MTN_CI`, `WAVE_CI` |
| Burkina Faso | `BF` | `OM_BF`, `MOOV_BF`, `WAVE_BF` |
| Mali | `ML` | `OM_ML`, `MOOV_ML` |
| Sénégal | `SN` | `OM_SN`, `FREE_SN`, `EXPRESSO_SN`, `WAVE_SN` |
| Togo | `TG` | `MOOV_TG`, `TMONEY_TG` |
| Guinée | `GN` | `OM_GN`, `MTN_GN` |
| Cameroun | `CM` | `OM_CM`, `MTN_CM` |
| Bénin | `BJ` | `MOOV_BJ`, `MTN_BJ` |
| RD Congo | `CD` | `OM_CD`, `AIRTEL_CD`, `MPESA_CD`, `AFRICELL_CD` |
| Niger | `NE` | `AIRTEL_NE`, `MOOV_NE`, `ZAMANI_NE` |

```typescript
import { PAYMENT_METHODS_BY_COUNTRY } from 'cinetpay-js'

// Lister les méthodes disponibles pour un pays
console.log(PAYMENT_METHODS_BY_COUNTRY.CI)
// ['OM_CI', 'MOOV_CI', 'MTN_CI', 'WAVE_CI']
```

### Canaux de paiement

| Canal | Description |
|-------|-------------|
| `PUSH` | Notification push envoyée au téléphone du client |
| `OTP` | Code OTP saisi par le client |
| `QRCODE` | QR Code scanné par le client |

### Codes de statut

| Code | Statut | Final ? | Description |
|------|--------|---------|-------------|
| 200 | `OK` | Non | Opération réussie |
| 100 | `SUCCESS` | **Oui** | Transaction traitée avec succès |
| 2001 | `INITIATED` | Non | En attente d'action utilisateur |
| 2002 | `PENDING` | Non | Paiement en cours |
| 2003 | `EXPIRED` | Non | Transaction expirée |
| 2010 | `FAILED` | **Oui** | Paiement échoué |
| 1200 | `TRANSACTION_EXIST` | **Oui** | Transaction déjà existante |
| 2005 | `INSUFFICIENT_BALANCE` | **Oui** | Solde insuffisant |
| 1005 | `INVALID_CREDENTIALS` | Non | Identifiants invalides |
| 1003 | `EXPIRED_TOKEN` | Non | Token JWT expiré |

## Gestion des erreurs

```typescript
import {
  CinetPayError,
  ApiError,
  AuthenticationError,
  NetworkError,
  TimeoutError,
  ValidationError,
} from 'cinetpay-js'

try {
  await client.payment.initialize(request, 'CI')
} catch (error) {
  if (error instanceof ValidationError) {
    // Données invalides (montant, email, etc.) — avant tout appel réseau
    console.log(error.message) // "[amount] must be a number between 100 and 2500000"
  }
  if (error instanceof ApiError) {
    console.log(error.apiCode)    // 1200
    console.log(error.apiStatus)  // 'TRANSACTION_EXIST'
    console.log(error.description) // 'La transaction existe déjà'
  }
  if (error instanceof AuthenticationError) {
    // Credentials invalides
  }
  if (error instanceof TimeoutError) {
    // Requête trop longue
  }
  if (error instanceof NetworkError) {
    // Problème réseau
  }
  // Toutes héritent de CinetPayError (sauf ValidationError qui hérite de TypeError)
  if (error instanceof CinetPayError) {
    // Catch-all pour les erreurs du SDK (API, auth, réseau, timeout)
  }
}
```

## Exemples d'intégration

### Next.js (App Router)

```typescript
// app/api/pay/route.ts
import { CinetPayClient } from 'cinetpay-js'
import { NextResponse } from 'next/server'

const client = new CinetPayClient({
  credentials: {
    CI: {
      apiKey: process.env.CINETPAY_API_KEY_CI!,
      apiPassword: process.env.CINETPAY_API_PASSWORD_CI!,
    },
  },
})

export async function POST(req: Request) {
  const { amount, orderId } = await req.json()

  const payment = await client.payment.initialize({
    currency: 'XOF',
    merchantTransactionId: orderId,
    amount,
    lang: 'fr',
    designation: 'Commande en ligne',
    clientEmail: 'client@email.com',
    clientFirstName: 'Jean',
    clientLastName: 'Dupont',
    successUrl: `${process.env.APP_URL}/orders/${orderId}/success`,
    failedUrl: `${process.env.APP_URL}/orders/${orderId}/failed`,
    notifyUrl: `${process.env.APP_URL}/api/webhook`,
    channel: 'PUSH',
  }, 'CI')

  return NextResponse.json({ paymentUrl: payment.paymentUrl })
}
```

### Express

```typescript
import express from 'express'
import { CinetPayClient, parseNotification, verifyNotification } from 'cinetpay-js'

const app = express()
app.use(express.json())

const client = new CinetPayClient({
  credentials: {
    CI: {
      apiKey: process.env.CINETPAY_API_KEY_CI!,
      apiPassword: process.env.CINETPAY_API_PASSWORD_CI!,
    },
  },
})

app.post('/webhook', async (req, res) => {
  const notification = parseNotification(req.body)
  const status = await client.payment.getStatus(notification.transactionId, 'CI')

  if (status.status === 'SUCCESS') {
    // Traiter le paiement réussi
  }

  res.sendStatus(200)
})
```

## Numéros de test (Sandbox)

| 4 derniers chiffres | Numéro CI | Comportement |
|---------------------|-----------|--------------|
| `0700` | `+2250707070700` | Succès immédiat |
| `0701` | `+2250707070701` | Pending 3s puis succès |
| `0703` | `+2250707070703` | Echec immédiat |
| `0704` | `+2250707070704` | Pending 3s puis échec |
| `0706` | `+2250707070706` | Pending infini |

## Écosystème CinetPay

`cinetpay-js` fait partie d'un écosystème complet de SDKs officiels :

| Package | Langage | Installation | Description |
|---|---|---|---|
| [`cinetpay-js`](https://www.npmjs.com/package/cinetpay-js) | TypeScript/Node.js | `npm install cinetpay-js` | SDK backend — paiements, transferts, solde |
| [`cinetpay-python`](https://pypi.org/project/cinetpay-python/) | Python | `pip install cinetpay-python` | SDK backend — sync + async, Django/FastAPI/Flask |
| [`cinetpay-go`](https://github.com/cinetpay/cinetpay-go) | Go | `go get github.com/cinetpay/cinetpay-go` | SDK backend — zero dep, net/http, context.Context |
| [`cinetpay-seamless`](https://www.npmjs.com/package/cinetpay-seamless) | JavaScript | `npm install cinetpay-seamless` | SDK frontend — popup checkout inline, event listeners |
| [`cinetpay-mcp`](https://www.npmjs.com/package/cinetpay-mcp) | TypeScript | `npx cinetpay-mcp` | MCP Server — intégration Claude, Cursor, AI assistants |
| [`cinetpay-laravel-sdk`](https://github.com/cinetpay/cinetpay-laravel-sdk) | PHP | `composer require cinetpay/laravel-sdk` | SDK Laravel |
| [`cinetpay-woocommerce`](https://github.com/cinetpay/cinetpay-woocommerce) | PHP | Plugin WordPress | Gateway WooCommerce |

## Support

Pour toute question ou problème lié à l'API CinetPay : **support@cinetpay.com**

## Licence

MIT
