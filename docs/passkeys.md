# Passkeys

Better Auth + passkeys fonctionne sur **lbxmb.fr** (navigateur).

Sur React Native / Expo, une intégration passkey native (attestations plateforme,
association RP ID, libs WebAuthn RN) reste non triviale et hors scope de ce chantier.

L’app conserve **« Continuer sur le site »** pour passkey / A2F / flux web sécurisés.
Pas de module passkey natif dans le binaire mobile pour l’instant.
