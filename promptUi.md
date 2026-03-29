                                                                                                                                                                       
  Tu développes le frontend d'une application de gestion hospitalière (SGH) en Vue 3 + PrimeVue 4 (preset Aura) + Lucide Icons.                                         
                                                                                                                                                                        
  ### Stack UI                                                                                                                                                          
  - Vue 3 + Vite + TypeScript                                                                                                                                           
  - PrimeVue 4.5 (preset Aura, locale FR, CSS layer désactivé)                                                                                                          
  - Icônes : lucide-vue-next (taille 18-19px)                                                                                                                           
  - Charts : Chart.js + vue-chartjs                                                                                                                                     
  - State : Pinia                                                                                                                                                       
  - Temps réel : socket.io-client
                                                                                                                                                                        
  ### Palette de couleurs (CSS variables dans style.css)                                                                                                                
  - Primary (bleu médical) : #1565C0 (light: #42A5F5, dark: #0D47A1)                                                                                                    
  - Secondary (teal) : #26A69A                                                                                                                                          
  - Accent (coral) : #FF7043
  - Success : #4CAF50 | Warning : #FFC107 | Danger : #F44336                                                                                                            
  - Background : #F5F7FA | Surface : #FFFFFF                                                                                                                            
  - Text primary : #212121 | Text secondary : #757575                                                                                                                   
  - Border : #E0E0E0                                                                                                                                                    
                                                                                                                                                                        
  ### Gradients   
  - --medico-gradient-primary : 135° du primary-dark au primary-light
  - --medico-gradient-sidebar : 180° vertical bleu                                                                                                                      
  - --medico-gradient-accent : primary → teal                                                                                                                           
                                                                                                                                                                        
  ### Typographie                                                                                                                                                       
  - Font : 'Inter', system-ui, sans-serif
  - Tailles : --font-xs (0.75rem) → --font-2xl (1.5rem)                                                                                                                 
                                                                                                                                                                        
  ### Spacing & Radius                                                                                                                                                  
  - --radius-sm: 6px | --radius-md: 8px | --radius-lg: 12px | --radius-xl: 20px                                                                                         
  - --sidebar-width: 260px | --sidebar-width-collapsed: 72px                                                                                                            
                                                                                                                                                                        
  ### Ombres                                                                                                                                                            
  - --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl                                                                                                                  
  - --shadow-glow-primary : lueur bleue pour éléments interactifs
                                                                                                                                                                        
  ### Principes de design
  1. Branding bleu médical — primary #1565C0 partout                                                                                                                    
  2. Glassmorphism : effets de verre, blur, transparence subtile                                                                                                        
  3. Gradients sur boutons, cards, overlays
  4. Animations fluides : cubic-bezier, transitions 150-250ms                                                                                                           
  5. Couleurs sémantiques pour les statuts (success/warning/danger)                                                                                                     
  6. Toute l'UI est en français                                                                                                                                         
  7. Responsive : sidebar collapsible, mobile-first                                                                                                                     
                  
  ### Overrides PrimeVue appliqués                                                                                                                                      
  - DataTable : header uppercase, hover gradient primary-50, pagination sans bordure
  - Inputs : border-radius 10px, padding 12px 16px, focus ring primary-100                                                                                              
  - Buttons : border-radius 10px, font-weight 600, hover translate(-1px) + shadow                                                                                       
  - Dialog : border-radius 16px, backdrop blur 8px, animation slideUp                                                                                                   
  - Toast : border-radius 12px, glass effect blur 12px                                                                                                                  
                                                                                                                                                                        
  ### Classes utilitaires disponibles                                                                                                                                   
  - .skeleton : placeholder de chargement animé                                                                                                                         
  - .status-badge : badge avec indicateur dot                                                                                                                           
  - .card-hover : élévation au hover
  - .fade-in-up : animation d'entrée                                                                                                                                    
  - .glass-card : effet verre dépoli                                                                                                                                    
  - .gradient-text : texte en gradient
  - .hover-lift : élévation au survol                                                                                                                                   
  - .stagger-1 à .stagger-8 : délais d'animation échelonnés
                                                                                                                                                                        
  ### Layout
  - DashboardLayout : flex avec sidebar fixe, contenu avec padding 0.75rem top / 1.5rem sides                                                                           
  - AuthLayout : split-screen (gradient animé à gauche, formulaire centré max-width 420px à droite)                                                                     
                                                                                                                                                                        
  ### Pattern de page type                                                                                                                                              
  - Entête avec titre (gradient-text ou h2) + boutons d'action                                                                                                          
  - Filtres en barre horizontale (PrimeVue InputText, Dropdown, Calendar)                                                                                               
  - Contenu principal : DataTable ou grille de cards                                                                                                                    
  - Modales pour création/édition (Dialog PrimeVue)                                                                                                                     
  - Toast pour confirmations/erreurs                                                                                                                                    
  - Badges colorés pour les statuts                                                                                                                                     
                    