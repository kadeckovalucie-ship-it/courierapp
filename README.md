# CourierNett

> **CourierNett je postavený na předpokladu, že čas kurýra je cennější než absolutní přesnost každého jednotlivého údaje.**

## O projektu

CourierNett je osobní kalkulačka pro kurýry.

Vznikl jako nástroj pro sledování skutečného zisku z kurýrní práce po odečtení nákladů na provoz vozidla a podnikání.

Kurýrní aplikace obvykle ukazují pouze výdělek. CourierNett se snaží odpovědět na jinou otázku:

**Kolik mi dnešní směna skutečně vydělala?**

<details>
<summary>Jak funguje</summary>

CourierNett pracuje s minimálním množstvím vstupních dat.

Uživatel dodá údaje o výdělku a vzdálenosti. Ostatní výpočty provádí aplikace automaticky.

Do výsledku jsou zahrnuty zejména:

* příjmy ze směn,
* náklady na palivo,
* amortizace vozidla,
* pravidelné náklady OSVČ,
* hodinový výdělek,
* čistý zisk.

Cílem není nahradit účetnictví ani daňovou evidenci.

Cílem je odstranit co nejvíce administrativy spojené s běžným provozem.

</details>

<details>
<summary>Data a soukromí</summary>

CourierNett nepoužívá vlastní backend.

Data nejsou ukládána na externí server a zůstávají pod kontrolou uživatele.

Veškeré výpočty probíhají lokálně v zařízení.

Aplikace umožňuje zálohování a export dat, ale jejich správa zůstává v rukou uživatele.

</details>

<details>
<summary>Automatizace a přesnost</summary>

CourierNett se snaží minimalizovat množství ruční práce.

Pokud existuje možnost získat dostatečně přesný výsledek automaticky, dostává přednost před ručním zapisováním, kontrolou a opravami dat.

Ne všechny údaje jsou proto získávány nejpřesnější možnou metodou. Některé části systému vědomě upřednostňují jednoduchost používání před maximální přesností.

Tato filozofie prostupuje celým projektem.

</details>

<details>
<summary>Měření vzdálenosti pomocí chytrých hodinek</summary>

Plánovaná podpora chytrých hodinek využívá GPS pro automatické měření vzdálenosti během směny.

Výsledná hodnota může být mírně vyšší než skutečný nájezd vozidla, protože zahrnuje i pohyb mimo vozidlo, například cestu do restaurace, k zákazníkovi nebo po parkovišti.

Tato odchylka je vědomým kompromisem.

Její odstranění by vyžadovalo složitější technické řešení, další hardware nebo více ruční práce ze strany uživatele.

CourierNett proto upřednostňuje automatické získávání dat s malou odchylkou před ručním zapisováním a následnou kontrolou každé směny.

</details>

<details>
<summary>Aktuální funkce</summary>

* evidence směn,
* přehled příjmů,
* výpočet nákladů na palivo,
* výpočet amortizace vozidla,
* výpočet paliva, amortizace a fixních nákladů,
* započítání pravidelných nákladů OSVČ,
* výpočet čistého zisku,
* měsíční statistiky,
* grafy výkonu,
* import dat z PDF,
* import výdělků ze screenshotů,
* export přehledů do PDF,
* lokální zálohy dat.

</details>

<details>
<summary>Co CourierNett není</summary>

CourierNett není:

* účetní systém,
* daňový software,
* ERP systém,
* dispečink,
* nástroj pro doporučování směn,
* predikční systém výdělků,
* heatmapa restaurací,
* nástroj pro sledování uživatelů.

Řeší jeden konkrétní problém: zjištění skutečného zisku z kurýrní práce.

</details>

<details>
<summary>Směr vývoje</summary>

Budoucí vývoj se zaměřuje především na:

* další automatizaci získávání vstupních dat,
* zjednodušení importů a exportů,
* nativní iOS aplikaci,
* nativní Android aplikaci,
* podporu chytrých hodinek na platformách watchOS a Wear OS.

Nové funkce jsou posuzovány především podle jedné otázky:

> Ušetří to kurýrovi čas?

Pokud ne, pravděpodobně do CourierNettu nepatří.

</details>

<details>
<summary>Poznámka autora</summary>

Projekt nevznikl jako ukázkové portfolio.

Vznikl jako osobní nástroj pro odstranění administrativy, která zabírá čas a nepřináší žádnou hodnotu.

Je průběžně testován v reálném provozu a vyvíjen podle skutečných zkušeností z terénu.

> Když mě něco stojí zbytečně moc času, mám tendenci si na to napsat vlastní řešení.

</details>
