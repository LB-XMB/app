# Envoi PKG (protocole PKG Sender)

LB’XMB réimplémente en TypeScript le protocole LAN de
[**PKG Sender**](https://github.com/Loopayeh/pkg-sender) par **Loopayeh**
(licence **MIT**) pour installer des `.pkg` (et copier des images disque) depuis
le téléphone vers une PS4 / PS5 jailbreakée.

Aucun code C# Avalonia n’est copié tel quel : on s’appuie sur l’API documentée
et la logique décrite dans `LoopDPI.Core` (install RPI/receiver, serveur HTTP
range, beacons UDP, GoldHEN).

## Crédits

- Projet : [Loopayeh/pkg-sender](https://github.com/Loopayeh/pkg-sender)
- Auteur : Loopayeh
- Licence : MIT (voir `assets/pkg-sender/LICENSE-pkg-sender.txt`)
- Payload GoldHEN embarqué : `ps4_dpi_payload.bin` (même provenance / MIT)

## Prérequis console

| Cible | Service |
| --- | --- |
| PS5 | `pkg-receiver.elf` (écoute `:12800`, beacon UDP `:12801`) — fourni dans les releases pkg-sender |
| PS4 | Remote Package Installer (RPI) sur `:12800` **ou** GoldHEN Payload Server (`9090` / `9021` / `9020`) |

Téléphone et console sur le **même Wi-Fi / LAN** (pas de VPN / isolation client).

## Flux

1. L’app démarre un mini serveur HTTP range sur le port **9898**.
2. Elle enregistre le fichier local (`telechargements/`) sous `/pkg/{id}`.
3. Elle appelle `POST http://<console>:12800/api/install` avec l’URL du PKG.
4. La console télécharge le fichier depuis le téléphone et installe.

GoldHEN : injection du payload + callback (même schéma que pkg-sender).

## Fichiers

- `services/pkgSender/` — découverte, HTTP, install, file
- `app/(tabs)/pkg.tsx` — UI
- FTP natif séparé : `@anttech/react-native-ftp` (`services/ftp.ts`)
