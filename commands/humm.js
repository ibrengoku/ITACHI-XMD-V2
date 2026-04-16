const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function normalizeJid(jid) {
    if (!jid) return jid;
    return jid.replace(/:\d+@/, '@');
}

async function hummCommand(sock, chatId, senderId, replyMessage, message) {
    if (!replyMessage) return; // Silencieux si pas de réponse

    // JID de l'utilisateur qui tape la commande
    const userJid = normalizeJid(senderId || message.key.remoteJid);

    // Clé originale pour suppression
    const ctxInfo = message.message?.extendedTextMessage?.contextInfo;
    const originalKey = ctxInfo ? {
        remoteJid: chatId,
        id: ctxInfo.stanzaId,
        participant: ctxInfo.participant || undefined
    } : null;

    try {
        // ── Image ──────────────────────────────────
        if (replyMessage.imageMessage) {
            const stream = await downloadContentFromMessage(replyMessage.imageMessage, 'image');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);

            // Envoyer dans le PV de l'utilisateur (pas là où il a tapé)
            await sock.sendMessage(userJid, {
                image: buf,
                caption: `🥷 *ITACHI-XMD* — Média récupéré`
            });

            // Supprimer l'original silencieusement
            if (originalKey) try { await sock.sendMessage(chatId, { delete: originalKey }); } catch {}
            return;
        }

        // ── Vidéo ──────────────────────────────────
        if (replyMessage.videoMessage) {
            const stream = await downloadContentFromMessage(replyMessage.videoMessage, 'video');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);

            await sock.sendMessage(userJid, {
                video: buf,
                caption: `🥷 *ITACHI-XMD* — Média récupéré`
            });

            if (originalKey) try { await sock.sendMessage(chatId, { delete: originalKey }); } catch {}
            return;
        }

        // ── Sticker ────────────────────────────────
        if (replyMessage.stickerMessage) {
            const stream = await downloadContentFromMessage(replyMessage.stickerMessage, 'sticker');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);

            await sock.sendMessage(userJid, {
                image: buf,
                caption: `🥷 *ITACHI-XMD* — Sticker récupéré`
            });

            if (originalKey) try { await sock.sendMessage(chatId, { delete: originalKey }); } catch {}
            return;
        }

        // ── Audio ──────────────────────────────────
        if (replyMessage.audioMessage) {
            const stream = await downloadContentFromMessage(replyMessage.audioMessage, 'audio');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);

            await sock.sendMessage(userJid, {
                audio: buf,
                mimetype: 'audio/mp4',
                ptt: replyMessage.audioMessage.ptt || false
            });

            if (originalKey) try { await sock.sendMessage(chatId, { delete: originalKey }); } catch {}
            return;
        }

    } catch (e) {
        console.error('❌ [humm]', e.message);
        // Silence total — aucun message d'erreur
    }
}

module.exports = hummCommand;
