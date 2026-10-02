import { Card, type CardProps } from '../Card';

/** Carte au trait indigo : réservée au résultat d'un covenant et au covenant le plus proche du seuil. */
export function SignatureCard(props: Omit<CardProps, 'signature'>) {
  return <Card {...props} signature />;
}
