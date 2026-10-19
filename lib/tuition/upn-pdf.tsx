import React from "react";
import path from "node:path";
import {Document, Page, Text, View, Font, renderToBuffer} from "@react-pdf/renderer";
import {upnDetails} from "./combined-template";
import {euro, type TuitionPlan} from "./plan";
Font.register({family: "TuitionRoboto", src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf")});
export async function tuitionUpnPdf(plan: TuitionPlan, sample = false) {
  const p = upnDetails(plan, sample);
  const rows = [
    ["Plačnik", `${p.payer.name}\n${p.payer.address}\n${p.payer.postalCode} ${p.payer.city}`],
    ["Prejemnik", `${p.name}\n${p.address}\n${p.city}`],
    ["IBAN prejemnika", p.iban], ["Referenca prejemnika", p.reference],
    ["Koda namena", p.purposeCode], ["Namen plačila", p.purpose],
    ["Rok plačila", p.deadline], ["Znesek", euro(p.amountCents)],
  ];
  return renderToBuffer(<Document title="UPN - vadnina za celotno sezono">
    <Page size="A4" style={{fontFamily:"TuitionRoboto",padding:48,color:"#33404f",fontSize:11,lineHeight:1.5}}>
      <Text style={{fontSize:20,marginBottom:22}}>APNEA.SI</Text>
      {sample && <Text style={{color:"#9e3f23",fontSize:14,marginBottom:15}}>VZOREC - NI ZA PLAČILO</Text>}
      <Text style={{fontSize:22,marginBottom:14}}>Plačilni nalog za celotno sezono</Text>
      <Text style={{marginBottom:24}}>Vadnina 2026/27 - podatki za vnos UPN v spletno ali mobilno banko</Text>
      {rows.map(([label,value]) => <View key={label} style={{flexDirection:"row",paddingVertical:9,borderBottomWidth:0.5,borderBottomColor:"#ddd"}}>
        <Text style={{width:160,color:"#585a5a"}}>{label}</Text><Text style={{flex:1}}>{value}</Text>
      </View>)}
      <Text style={{marginTop:26}}>Izberite samo eno možnost: celotno vadnino s tem UPN ali dva obroka prek Stripe povezave v sporočilu.</Text>
      <Text style={{marginTop:12}}>Če ste že plačali s kartico, tega UPN ne plačujte. Če ste že nakazali na banko, ne plačujte še prek Stripe povezave.</Text>
      <Text style={{marginTop:24,fontSize:9,color:"#585a5a"}}>To je plačilni nalog, ne račun. Uradni račun prejmete po potrditvi plačila. Za pomoč: info@apnea.si.</Text>
    </Page>
  </Document>);
}
