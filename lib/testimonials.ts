export type Testimonial = {
  text: string;
  name: string;
  detail?: string;
};

export const homeGoogleReviews: Testimonial[] = [
  {
    text: "Zelo strokovno izpeljan tečaj. Zelo priporočam. Izveš veliko uporabnih stvari.",
    name: "Peter Pajk",
    detail: "Google ocena",
  },
  {
    text: "Odličen tečaj z vrhunsko ekipo - strokovno, sproščeno in z veliko prakse. Res prava izkušnja, ki jo priporočam vsakemu.",
    name: "Mitja Mohorič",
    detail: "Google ocena",
  },
  {
    text: "Hvala za vso znanje, pomoč in podporo pri srkanju novega znanja pri potopih na vdih. Resnično profesionalci na vseh področjih. Ekipa kapo dol.",
    name: "david kozjek",
    detail: "Google ocena",
  },
];
