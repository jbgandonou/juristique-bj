<template>
  <div class="tarifs-page">
    <!-- Upgrade prompt banner -->
    <div v-if="showUpgradeBanner" class="upgrade-banner fade-in-up">
      <Crown :size="18" class="upgrade-banner-icon" />
      <span>Cette fonctionnalité nécessite un abonnement Premium.</span>
    </div>

    <!-- Header -->
    <section class="page-header fade-in-up">
      <h1 class="gradient-text">Nos offres</h1>
      <p class="page-subtitle">
        Choisissez le plan qui correspond à vos besoins. Commencez gratuitement, évoluez quand vous le souhaitez.
      </p>
    </section>

    <!-- Billing Toggle -->
    <div class="billing-toggle fade-in-up stagger-1">
      <span :class="['toggle-label', { active: billing === 'monthly' }]">Mensuel</span>
      <button class="toggle-switch" @click="toggleBilling" :aria-pressed="billing === 'yearly'">
        <span class="toggle-thumb" :class="{ 'is-yearly': billing === 'yearly' }" />
      </button>
      <span :class="['toggle-label', { active: billing === 'yearly' }]">
        Annuel
        <span class="savings-badge">2 mois offerts</span>
      </span>
    </div>

    <!-- Pricing Cards -->
    <div class="cards-wrapper fade-in-up stagger-2">
      <!-- Free Card -->
      <div class="glass-card card-hover pricing-card">
        <div class="plan-name">Gratuit</div>
        <div class="plan-price">
          <span class="price-amount">0</span>
          <span class="price-currency">FCFA</span>
          <span class="price-period">/mois</span>
        </div>
        <p class="plan-description">Idéal pour découvrir la plateforme et ses textes.</p>

        <ul class="features-list">
          <li v-for="feature in freeFeatures" :key="feature" class="feature-item">
            <Check :size="16" class="feature-icon" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <button class="plan-btn plan-btn--disabled" disabled>
          Votre plan actuel
        </button>
      </div>

      <!-- Premium Card -->
      <div class="glass-card card-hover pricing-card pricing-card--premium">
        <div class="popular-badge">
          <Crown :size="12" />
          Populaire
        </div>

        <div class="plan-name plan-name--premium gradient-text-gold">Premium</div>
        <div class="plan-price">
          <span class="price-amount">{{ billing === 'monthly' ? '5 000' : '50 000' }}</span>
          <span class="price-currency">FCFA</span>
          <span class="price-period">{{ billing === 'monthly' ? '/mois' : '/an' }}</span>
        </div>
        <p class="plan-description">
          {{ billing === 'yearly' ? 'Économisez l\'équivalent de 2 mois.' : 'Accès complet à toutes les fonctionnalités.' }}
        </p>

        <ul class="features-list">
          <li v-for="feature in premiumFeatures" :key="feature" class="feature-item">
            <Check :size="16" class="feature-icon feature-icon--gold" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <button class="plan-btn plan-btn--primary">
          Commencer l'essai gratuit
        </button>
      </div>
    </div>

    <!-- FAQ -->
    <section class="faq-section fade-in-up stagger-3">
      <h2 class="faq-title">Questions fréquentes</h2>

      <div class="faq-list">
        <div
          v-for="(item, index) in faqItems"
          :key="index"
          class="faq-item glass-card"
          @click="toggleFaq(index)"
        >
          <div class="faq-question">
            <span>{{ item.question }}</span>
            <span class="faq-chevron" :class="{ 'is-open': openFaq === index }">
              <ChevronDown :size="18" />
            </span>
          </div>
          <div class="faq-answer" :class="{ 'is-open': openFaq === index }">
            <p>{{ item.answer }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Check, Crown, CreditCard, Smartphone, ChevronDown } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const showUpgradeBanner = computed(() => route.query.upgrade === 'true');

const billing = ref<'monthly' | 'yearly'>('monthly');

const toggleBilling = () => {
  billing.value = billing.value === 'monthly' ? 'yearly' : 'monthly';
};

const freeFeatures = [
  'Accès aux textes publiés',
  'Recherche simple',
  '3 alertes de veille',
  'Lecture des 3 premiers commentaires',
];

const premiumFeatures = [
  'Tout le plan Gratuit',
  'Recherche avancée + export',
  'Alertes illimitées',
  'Commentaires et analyses complètes',
  'Droit comparé (côte à côte)',
  'Export PDF & Word',
  'Support prioritaire',
];

const openFaq = ref<number | null>(null);

const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index;
};

const faqItems = [
  {
    question: 'Puis-je annuler à tout moment ?',
    answer:
      'Oui. Vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel. Vous conservez l\'accès Premium jusqu\'à la fin de la période payée, sans frais supplémentaires.',
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      'Nous acceptons les cartes bancaires internationales via Stripe (Visa, Mastercard) ainsi que les paiements Mobile Money via FedaPay (MTN Mobile Money, Moov Money, Wave et autres opérateurs de la sous-région).',
  },
  {
    question: 'Y a-t-il un essai gratuit ?',
    answer:
      'Oui. Le plan Gratuit est disponible sans limite de durée. Pour le plan Premium, nous proposons un essai gratuit de 14 jours, sans carte bancaire requise.',
  },
  {
    question: "L'abonnement est-il par utilisateur ?",
    answer:
      "L'abonnement Premium est individuel (par compte). Pour les cabinets ou organisations souhaitant plusieurs accès, contactez-nous pour un devis sur mesure.",
  },
];
</script>

<style scoped>
.tarifs-page {
  display: flex;
  flex-direction: column;
  gap: 48px;
  align-items: center;
  padding-bottom: 64px;
}

/* Header */
.page-header {
  text-align: center;
  max-width: 600px;
}

.page-header h1 {
  font-size: var(--font-4xl);
  font-weight: 800;
  margin-bottom: 12px;
}

.page-subtitle {
  font-size: var(--font-lg);
  color: var(--juris-text-secondary);
  line-height: 1.6;
}

/* Billing Toggle */
.billing-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-label {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--juris-text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s ease;
}

.toggle-label.active {
  color: var(--juris-text);
  font-weight: 600;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--juris-border);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
}

.toggle-switch:has(.is-yearly) {
  background: var(--juris-gradient-gold);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.toggle-thumb.is-yearly {
  transform: translateX(20px);
}

.savings-badge {
  display: inline-block;
  background: rgba(198, 148, 42, 0.12);
  color: var(--juris-secondary);
  font-size: var(--font-xs);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  letter-spacing: 0.02em;
}

/* Cards Wrapper */
.cards-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 900px;
  width: 100%;
}

/* Pricing Card */
.pricing-card {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.pricing-card--premium {
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
}

.pricing-card--premium::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: calc(var(--radius-lg) + 2px);
  background: var(--juris-gradient-gold);
  z-index: -1;
}

/* Popular Badge */
.popular-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--juris-gradient-gold);
  color: white;
  font-size: var(--font-xs);
  font-weight: 700;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  letter-spacing: 0.04em;
  white-space: nowrap;
  box-shadow: var(--shadow-glow-gold);
}

/* Plan Name */
.plan-name {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--juris-text-secondary);
  margin-bottom: 16px;
  margin-top: 8px;
}

.plan-name--premium {
  font-size: var(--font-xl);
}

/* Plan Price */
.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.price-amount {
  font-size: 2.75rem;
  font-weight: 800;
  color: var(--juris-text);
  line-height: 1;
}

.price-currency {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--juris-text-secondary);
}

.price-period {
  font-size: var(--font-sm);
  color: var(--juris-text-muted);
}

/* Plan Description */
.plan-description {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  margin-bottom: 24px;
  min-height: 40px;
}

/* Features List */
.features-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  flex: 1;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--font-sm);
  color: var(--juris-text);
}

.feature-icon {
  color: var(--juris-success);
  flex-shrink: 0;
}

.feature-icon--gold {
  color: var(--juris-secondary);
}

/* Plan Buttons */
.plan-btn {
  width: 100%;
  padding: 14px 20px;
  border-radius: var(--radius-lg);
  font-size: var(--font-sm);
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.02em;
}

.plan-btn--disabled {
  background: var(--juris-border);
  color: var(--juris-text-muted);
  cursor: not-allowed;
}

.plan-btn--primary {
  background: var(--juris-gradient-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.plan-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* FAQ */
.faq-section {
  width: 100%;
  max-width: 700px;
}

.faq-title {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 24px;
  text-align: center;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.faq-item:hover {
  box-shadow: var(--shadow-lg);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--juris-text);
  user-select: none;
}

.faq-chevron {
  color: var(--juris-text-muted);
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-chevron.is-open {
  transform: rotate(180deg);
  color: var(--juris-primary-light);
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease;
}

.faq-answer.is-open {
  max-height: 200px;
  padding-bottom: 18px;
}

.faq-answer p {
  padding: 0 20px;
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  line-height: 1.7;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: var(--font-3xl);
  }

  .cards-wrapper {
    grid-template-columns: 1fr;
    max-width: 480px;
  }

  .pricing-card--premium {
    order: -1;
  }
}

.upgrade-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  margin-bottom: 8px;
  background: rgba(var(--juris-secondary-rgb, 212, 160, 23), 0.12);
  border: 1px solid rgba(var(--juris-secondary-rgb, 212, 160, 23), 0.35);
  border-radius: 10px;
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--juris-text);
}

.upgrade-banner-icon {
  color: var(--juris-secondary);
  flex-shrink: 0;
}
</style>
