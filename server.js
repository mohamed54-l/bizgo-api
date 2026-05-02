const express = require("express");
const paydunya = require("paydunya");
const app = express();

app.use(express.json());

// Configuration de ton compte Mohamed Guebre
paydunya.setup({
  master_key: "**************************", // Ta Clé Principale
  public_key: "**************************", // Ta Clé Publique
  private_key: "**************************", // Ta Clé Privée
  token: "**************************",      // Ton Token
  mode: "test" 
});

// Route pour générer une facture spécifique
app.get("/generer-facture", async (req, res) => {
    let invoice = new paydunya.CheckoutInvoice();
    
    // On peut imaginer que ces infos viendront de ton interface plus tard
    const montantFacture = 10000; // Exemple : 10 000 FCFA
    const clientNom = "Client Demo";

    // Configuration de la facture PayDunya
    invoice.addItem("Facture BizGo", 1, montantFacture, montantFacture, "Prestation de service via BizGo");
    invoice.total_amount = montantFacture;
    invoice.description = `Facture générée par l'application BizGo pour ${clientNom}`;

    // Création et redirection
    invoice.create().then(() => {
        res.redirect(invoice.getInvoiceUrl());
    }).catch((e) => {
        res.status(500).send("Erreur lors de la génération : " + e.message);
    });
});

app.get("/", (req, res) => {
    res.send("🚀 BizGo : Système de Génération de Factures prêt.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur de facturation lancé sur port " + PORT));