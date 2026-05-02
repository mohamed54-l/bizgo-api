const { onRequest } = require("firebase-functions/v2/https");
const paydunya = require("paydunya");

// 1. Configuration de ton compte Mohamed Guebre
paydunya.setup({
  master_key: "**************************",
  public_key: "**************************",
  private_key: "**************************",
  token: "**************************",
  mode: "test" 
});

// 2. La fonction qui va créer le lien de paiement pour BizGo
exports.creerPaiement = onRequest(async (req, res) => {
    let invoice = new paydunya.CheckoutInvoice();
    
    // On définit ce que le client achète (Abonnement à 5000 FCFA)
    invoice.addItem("Abonnement BizGo", 1, 5000, 5000, "Accès premium aux services digitaux");
    invoice.total_amount = 5000;
    invoice.description = "Paiement pour services Community Management de l'agence MHD Digital";

    // On crée la facture et on redirige le client vers PayDunya
    invoice.create().then(() => {
        res.redirect(invoice.getInvoiceUrl());
    }).catch((e) => {
        res.status(500).send("Erreur de connexion à PayDunya : " + e.message);
    });
});
