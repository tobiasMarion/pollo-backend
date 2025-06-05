# 📌 Pollo Api

> An app to sync a million of fireflies around there

![Badge do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-blue?style=flat-square)

> 🇧🇷 [If you want to understand what is really going on here, I suggest this reading](https://www.tabnews.com.br/tobiasMarion/tentando-recriar-as-pulseiras-do-coldplay-com-um-jr-e-js)

---

## 📜 Table of Contents
- [About](#about)
- [Contact](#contact)
- [Demo](https://youtu.be/EwpoS9gP3Vo)

---

## 📖 About <a name="about"></a>

Pollo is inspired by the famous glowing bracelets worn by people at Coldplay concerts. However, our goal here is to create the same effect without using any hardware infrastructure, just the participants’ phones (we’ll treat each one as a pixel) and a server.

An authenticaded admin can create an event where anounimous participants can join. Once a certain amount of participant joined the event, the admin can close the event, mapping the users to a 3d space representing their geolocation.

Once the event is running, the admin can send through websockets predefined effects commands that will be redirected to the participants. Each participant calculates each own state according to the received instructions. This means that Pollo does not have a frame rate and all participants are notified only when the event current effect state changes.

Unfortunately, the geolocation reported by mobile devices alone is not sufficient to accurately reconstruct their original positions in space. The core idea behind Pollo / Sparkle is to use the relative distances between devices to build a graph, which can then be used in a physical simulation to reduce the error in the reconstructed positions.


---


📬 Contact <a name="contact"></a>
📧 Tobias Cadoná Marion — contato@tobiasmarion.com

Made with 💜 by Tobias
