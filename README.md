# Inventaire des ouvrages hydrauliques

Application de terrain de **Nibras Expertise SARL** (Nouakchott, Mauritanie) pour inventorier et suivre les forages, puits, réseaux d'eau et abreuvoirs : état, localisation GPS, photos, historique des visites, exports Excel et QGIS. Interface en français et en arabe, fonctionnement sans réseau.

Adresse : https://nibrasexpertise.github.io/inventaire-ouvrages/

Les fiches saisies restent dans le téléphone de chaque enquêteur ; elles ne sont jamais envoyées vers ce dépôt.

Contact : nibrasexpertise@gmail.com · +222 33 03 55 33

## Sources et composants

- Moughataas : ANSADE, recensement général de la population et de l'habitat 2023 (liste reprise par citypopulation.de).
- Communes : 238 communes du RGPH 2023 de l'ANSADE (dont 9 à Nouakchott), rattachées à leur moughataa (liste reprise par citypopulation.de).
- Image satellite : Esri World Imagery (attribution affichée sur la carte ; conditions d'utilisation à vérifier avant un usage commercial à grande échelle).
- Carte interactive : Leaflet 1.9.4 (licence BSD-2), fichiers `leaflet.js` et `leaflet.css`.
- Envoi automatique vers le bureau : programme Google Apps Script (`base-google/Code.gs`) installé dans un tableau Google Sheets du cabinet ; protégé par un code secret choisi par le Directeur Général, qui n'est jamais écrit dans ce dépôt.
