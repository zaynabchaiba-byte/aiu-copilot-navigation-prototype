# AIU Copilot – Prototype de navigation maritime

Ce projet est un prototype d'application web développé dans le cadre de l'exercice technique **AIU Copilot – Waze de la navigation maritime**.

L'application permet de visualiser la trajectoire de navires et d'analyser certaines variables spatio-temporelles comme la vitesse ou le régime moteur.

---

## Fonctionnalités

- Sélection d'un navire (IMO1, IMO2, IMO3)
- Filtrage par période temporelle
- Visualisation de la trajectoire sur une carte interactive
- Coloration des segments selon la variable choisie
- Graphique temporel de la variable (Speed ou RPM)
- Indicateurs KPI :
  - Distance parcourue
  - Durée de navigation
  - Variable moyenne

---

## Technologies utilisées

- **Leaflet.js** – visualisation cartographique
- **Chart.js** – graphique temporel
- **PapaParse** – lecture de fichiers CSV
- **HTML / CSS / JavaScript**

---

## Structure du projet
```
aiu-copilot-navigation-prototype
│
├── README.md
├── Technical_Answers.pdf
│
└── AIU_APP
    │
    ├── index.html
    ├── script.js
    ├── style.css
    │
    └── data
        ├── ships_dataset.csv
        └── trajectory_segments.csv
```
---

## Données

Les données utilisées proviennent du fichier fourni dans l'exercice technique et représentent les positions d'un navire sur une période d'environ 10 mois.

Les données ont été transformées en deux jeux de données :

- **ships_dataset.csv** : points temporels
- **trajectory_segments.csv** : segments de trajectoire

---

## Auteur

Zaynab Chaiba  
Master 2 Technologies des Systèmes d’Information – Géomatique
