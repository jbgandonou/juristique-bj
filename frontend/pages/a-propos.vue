<template>
  <div class="about-page">
    <!-- Hero -->
    <section class="page-header fade-in-up">
      <h1>À propos de <span class="gradient-text">Juristique.bj</span></h1>
      <p class="mission-statement">
        Rendre le droit africain francophone accessible à tous les professionnels du droit
      </p>
    </section>

    <!-- Mission -->
    <section class="mission-section fade-in-up stagger-1">
      <div class="glass-card mission-card">
        <div class="mission-icon">
          <Scale :size="32" />
        </div>
        <div class="mission-body">
          <h2>Notre mission</h2>
          <p>
            Juristique.bj est la première plateforme de référence juridique dédiée à l'Afrique francophone.
            Nous agrégeons, classons et enrichissons les textes de droit de 26 pays afin que chaque juriste,
            magistrat, chercheur ou étudiant dispose d'un outil fiable, rapide et complet — depuis Dakar,
            Abidjan, Cotonou ou Paris.
          </p>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="values-section fade-in-up stagger-2">
      <h2 class="section-title">Nos engagements</h2>
      <div class="values-grid">
        <div
          v-for="value in values"
          :key="value.title"
          class="glass-card card-hover value-card"
        >
          <div class="value-icon">
            <component :is="value.icon" :size="26" />
          </div>
          <h3 class="value-title">{{ value.title }}</h3>
          <p class="value-description">{{ value.description }}</p>
          <div v-if="value.stat" class="value-stat">
            <span class="stat-number gradient-text">{{ value.stat.number }}</span>
            <span class="stat-label">{{ value.stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section class="team-section fade-in-up stagger-3">
      <h2 class="section-title">Notre équipe</h2>
      <p class="section-subtitle">Des juristes et ingénieurs passionnés par l'accès au droit.</p>

      <div class="team-grid">
        <div
          v-for="member in teamMembers"
          :key="member.name"
          class="glass-card card-hover team-card"
        >
          <div class="avatar-placeholder">
            <User :size="28" />
          </div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-role">{{ member.role }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section class="contact-section fade-in-up stagger-4">
      <div class="glass-card contact-card">
        <h2 class="section-title">Nous contacter</h2>
        <p class="section-subtitle">Une question, un partenariat, un signalement ? Écrivez-nous.</p>

        <div class="contact-links">
          <a href="mailto:contact@juristique.bj" class="contact-item">
            <div class="contact-icon">
              <Mail :size="20" />
            </div>
            <div>
              <div class="contact-label">Email</div>
              <div class="contact-value">contact@juristique.bj</div>
            </div>
          </a>

          <a href="https://twitter.com/juristique_bj" target="_blank" rel="noopener noreferrer" class="contact-item">
            <div class="contact-icon">
              <Twitter :size="20" />
            </div>
            <div>
              <div class="contact-label">Twitter / X</div>
              <div class="contact-value">@juristique_bj</div>
            </div>
          </a>

          <a href="https://linkedin.com/company/juristique-bj" target="_blank" rel="noopener noreferrer" class="contact-item">
            <div class="contact-icon">
              <Linkedin :size="20" />
            </div>
            <div>
              <div class="contact-label">LinkedIn</div>
              <div class="contact-value">Juristique.bj</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Scale, Globe, ShieldCheck, Users, User, Mail, Twitter, Linkedin } from 'lucide-vue-next';

const values = [
  {
    icon: Globe,
    title: 'Exhaustivité',
    description:
      'Une couverture géographique et thématique sans équivalent : 26 pays d\'Afrique francophone, 42 thèmes du droit.',
    stat: { number: '26 pays', label: '42 thèmes' },
  },
  {
    icon: ShieldCheck,
    title: 'Fiabilité',
    description:
      'Chaque texte est identifié, daté et vérifié par notre équipe de juristes avant publication.',
    stat: { number: '100 %', label: 'vérifiés par des juristes' },
  },
  {
    icon: Users,
    title: 'Communauté',
    description:
      'Les professionnels du droit enrichissent la plateforme avec leurs analyses, commentaires et retours d\'expérience.',
    stat: { number: 'Expert·es', label: 'analyses & commentaires' },
  },
];

const teamMembers = [
  { name: 'Jean B. Gandonou', role: 'Fondateur & Développeur' },
  { name: 'Poste ouvert', role: 'Juriste senior – Droit OHADA' },
  { name: 'Poste ouvert', role: 'Responsable contenu & veille' },
];
</script>

<style scoped>
.about-page {
  display: flex;
  flex-direction: column;
  gap: 56px;
  padding-bottom: 64px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

/* Header */
.page-header {
  text-align: center;
}

.page-header h1 {
  font-size: var(--font-4xl);
  font-weight: 800;
  margin-bottom: 16px;
  color: var(--juris-text);
}

.mission-statement {
  font-size: var(--font-xl);
  color: var(--juris-text-secondary);
  font-style: italic;
  line-height: 1.5;
  max-width: 640px;
  margin: 0 auto;
}

/* Section Titles */
.section-title {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
  margin-bottom: 28px;
}

/* Mission Card */
.mission-card {
  display: flex;
  gap: 24px;
  padding: 32px;
  align-items: flex-start;
}

.mission-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background: var(--juris-gradient-primary);
  color: white;
  box-shadow: var(--shadow-glow-primary);
}

.mission-body h2 {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 12px;
}

.mission-body p {
  font-size: var(--font-base);
  color: var(--juris-text-secondary);
  line-height: 1.75;
}

/* Values */
.values-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.value-card {
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.value-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background: var(--juris-primary-50);
  color: var(--juris-primary);
}

.value-title {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--juris-text);
}

.value-description {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
  line-height: 1.65;
  flex: 1;
}

.value-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid var(--juris-border-light);
  padding-top: 12px;
  margin-top: 4px;
}

.stat-number {
  font-size: var(--font-xl);
  font-weight: 800;
}

.stat-label {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
}

/* Team */
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.team-card {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-placeholder {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--juris-gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-name {
  font-size: var(--font-base);
  font-weight: 700;
  color: var(--juris-text);
  margin-bottom: 4px;
}

.member-role {
  font-size: var(--font-sm);
  color: var(--juris-text-secondary);
}

/* Contact */
.contact-card {
  padding: 36px 32px;
  text-align: center;
}

.contact-card .section-title {
  margin-bottom: 8px;
}

.contact-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border: 1px solid var(--juris-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--juris-text);
  transition: all 0.2s ease;
  min-width: 200px;
  background: var(--juris-surface);
}

.contact-item:hover {
  border-color: var(--juris-primary-lighter);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  color: var(--juris-text);
}

.contact-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--juris-primary-50);
  color: var(--juris-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-label {
  font-size: var(--font-xs);
  color: var(--juris-text-muted);
  font-weight: 500;
  margin-bottom: 2px;
}

.contact-value {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--juris-primary-light);
}

/* Responsive */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: var(--font-3xl);
  }

  .mission-card {
    flex-direction: column;
    gap: 16px;
  }

  .values-grid,
  .team-grid {
    grid-template-columns: 1fr;
  }

  .contact-links {
    flex-direction: column;
    align-items: center;
  }

  .contact-item {
    width: 100%;
    max-width: 360px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .values-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .team-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
