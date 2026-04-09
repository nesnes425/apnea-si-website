import { siteConfig } from "@/lib/config";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";

export const metadata = {
  title: "Splošni pogoji poslovanja",
  description: "Splošni pogoji poslovanja — tečaji in treningi prostega potapljanja. Apnea Slovenija.",
};

export default function PogojiPage() {
  return (
    <Section>
      <div className="max-w-3xl">
        <Overline>Pogoji</Overline>
        <h1 className="text-[34px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.02em] text-navy mb-10">
          Splošni pogoji poslovanja
        </h1>

        <div className="prose-apnea">
          <h2>Varstvo osebnih podatkov</h2>
          <p>
            Ponudnika pri poslovanju neizogibno srečujeta z osebnimi podatki svojih strank. Uporabniki morajo posredovati resnične in popolne podatke za izdajo računov in dosegljivost. Spremembe podatkov je potrebno takoj sporočiti; če tega ne storijo v 3 delovnih dneh, se računi štejejo za veljavno poslane.
          </p>

          <h2>Zdravstvena in psihofizična sposobnost</h2>
          <p>
            Uporabnik potrjuje, da je seznanjen, da je apnea šport s povezanimi tveganji in nevarnostmi. Posebej se svetuje posvet s posameznikovim zdravnikom pred plačilom storitev. Vaditelj mora biti seznanjen z relevantnim zdravstvenim stanjem udeleženca. V nasprotnem primeru je udeleženec odškodninsko odgovoren ponudniku.
          </p>

          <h2>Tečaji in delavnice — sistem plačevanja in rezervacij</h2>
          <p>
            <strong>Nakup:</strong> Tečaj ali delavnico je mogoče naročiti po prejemu računa s strani ponudnika. Po plačilu se rezervira prost termin. Rezerviran termin se šteje za unovčeno dobroimetje, če rezervacija NI pravočasno odpovedana.
          </p>

          <h3>1. Preklic izvedbe s strani ponudnika</h3>
          <p>
            V kolikor izvedbo rezerviranega termina prekliče ponudnik (npr. zaradi neugodnih vremenskih razmer, izbruha epidemije, zaprtja bazena, drugega dejavnika ogrožanja varnosti ali zdravja, hude bolezni vaditelja in nemožnosti zagotovitve drugega vaditelja), se dobroimetje NE šteje kot unovčeno in uporabnik lahko rezervira drug poljuben termin.
          </p>

          <h3>2. Pravočasno odpovedana rezervacija s strani uporabnika</h3>
          <p>
            Po rezervaciji termina lahko uporabnik rezervacijo po elektronski pošti (ali pisno s priporočeno pošiljko) odpove tako, da ponudnik prejme odpoved <strong>vsaj 10 delovnih dni pred izvedbo</strong> rezerviranega termina. Rezervacija se šteje za pravočasno odpovedano.
          </p>
          <p>
            Rok 10 delovnih dni ponudniku zagotavlja dovolj časa za iskanje nadomestnega udeleženca.
          </p>

          <h3>3. Nepravočasno odpovedana rezervacija s strani uporabnika</h3>
          <p>
            V kolikor je rezervacija termina odpovedana <strong>9 ali manj delovnih dni</strong> pred terminom izvedbe, se dobroimetje šteje za unovčeno, ker rezervacija ni pravočasno odpovedana.
          </p>
          <p>
            Uporabnik ne more zahtevati vračila denarja tudi v primeru: neudeležbe po lastni želji, bolezni, prometnih nesreč, okvar vozila ali drugih razmer, vključno s primeri višje sile.
          </p>
          <p className="text-sm text-muted-text">
            Opomba: Dan podaje odpovedi in dan izvedbe se ne vštevata v rok 10 delovnih dni. Delovni dan je vsak dan od ponedeljka do petka, razen zakonom določenih praznikov in dela prostih dni.
          </p>

          <h2>Treningi — letna članarina in vadnina</h2>
          <p>
            Treningi se izvajajo preko društva <strong>Športno društvo Apnea Slovenija</strong>.
          </p>
          <p>
            <strong>Letno članstvo:</strong> Pogoj je veljavna letna članarina v višini €35 na leto. Plačilo je nepreklicno, vračilo ni mogoče v nobenem primeru.
          </p>
          <p>
            <strong>Letna vadnina:</strong> Poleg članarine je potrebno plačati letno vadnino, ki varira glede na lokacijo in frekvenco obiskovanja. Vadnina se lahko plača v dveh obrokih ali enkratno.
          </p>
          <p>
            <strong>Rok za odpoved letne vadnine:</strong> Odpovedati je mogoče le do osmega tedna trajanja programa za določeno lokacijo. Odpoved se poda po elektronski pošti ali s priporočeno pošiljko.
          </p>

          <h2>Neporavnane obveznosti</h2>
          <p>
            Ponudnik je udeležencem, ki zamujajo s plačilom, upravičen zaračunati zakonske zamudne obresti.
          </p>

          <h2>Pravice in dolžnosti za SSI certifikat</h2>
          <p>
            Udeleženci, ki želijo pridobiti SSI certifikat, se morajo ravnati skladno s pravili SSI. Dokumenti SSI predstavljajo integralne dele pogodbe, vendar ponudnik nima vpliva na njihovo vsebino in ne nosi odgovornosti.
          </p>

          <h2>Pritožbeni postopek</h2>
          <p>
            Reklamacije, pritožbe in predloge je mogoče nasloviti na{" "}
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
            Ponudnik bo potrdil prejem v 5 delovnih dneh in obvestil o postopku (najmanj 10 delovnih dni).
          </p>

          <h2>Dovoljena uporaba</h2>
          <p>
            Vse informacije na spletnem mestu so predmet avtorske zaščite in drugih oblik intelektualne lastnine. Kakršna koli obdelava zahteva predhodno soglasje ponudnika. Spletno stran je dovoljeno uporabljati samo za naročilo, informiranje in seznanitev s storitvami.
          </p>

          <h2>Končne določbe</h2>
          <p>
            V primeru posebnega dogovora med naročnikom in ponudnikom veljajo določbe dogovora pred Splošnimi pogoji. Ponudnik lahko kadarkoli spremeni pogoje; spremembe veljajo 15 dni po objavi. Uporabnik, ki nadaljuje z uporabo spletne strani, se šteje, da soglaša s spremembami.
          </p>
          <p>Vsi spori se rešujejo v skladu s slovenskim pravom.</p>

          <p className="text-sm text-muted-text mt-10">
            Začetek veljavnosti: 14. avgust 2025. Posodobljeno: april 2026.
          </p>
        </div>
      </div>
    </Section>
  );
}
