import type { RoadmapStep } from '../types';

export const roadmap: RoadmapStep[] = [
  { id: 'rm-01', order: 1, title: 'Comprendre', horizon: 'Bêta actuelle', summary: 'Rassembler financements, contrats, encours et balances au même endroit.', capabilities: ['Registre des financements', 'Documents ouverts à la page citée', 'Balances versionnées et mapping comptable'], in_beta: true },
  { id: 'rm-02', order: 2, title: 'Structurer', horizon: 'MVP pilote', summary: 'Calculer chaque covenant de façon déterministe et remonter chaque chiffre à sa source.', capabilities: ['Moteur de calcul explicable', 'Retraitements justifiés', 'Calculs enregistrés et empreinte'], in_beta: true },
  { id: 'rm-03', order: 3, title: 'Anticiper', horizon: 'V1', summary: 'Voir venir les échéances, les marches de seuil et les tensions de marge.', capabilities: ['Échéancier consolidé', 'Alertes par e-mail', 'Tests prévisionnels'], in_beta: false },
  { id: 'rm-04', order: 4, title: 'Décider', horizon: 'Au-delà de la V1', summary: 'Préparer un refinancement et arbitrer avec des simulations partagées.', capabilities: ['Simulations multi-scénarios', 'Préparation des négociations bancaires', 'Extraction assistée validée par l’humain'], in_beta: false },
];
