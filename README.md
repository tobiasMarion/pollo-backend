# 📌 Pollo Api

> An app to sync a million of fireflies around there

![Badge do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-blue?style=flat-square)

> 🇧🇷 [If you want to understand what is really going on here, I suggest this reading](https://www.tabnews.com.br/tobiasMarion/tentando-recriar-as-pulseiras-do-coldplay-com-um-jr-e-js)

---

## 📜 Table of Contents
- [About](#about)
- [Contact](#contact)

---

## 📖 About <a name="about"></a>

Pollo is inspired by the famous glowing bracelets worn by people at Coldplay concerts. However, our goal here is to create the same effect without using any hardware infrastructure, just the participants’ phones (we’ll treat each one as a pixel) and a server.

An authenticaded admin can create an event where anounimous participants can join. Once a certain amount of participant joined the event, the admin can close the event, mapping the users to a 2d matrix representing their geolocation whithout scale. It is important to highlight that **participants can join into a closed event**, we use this term because the 2d matrix already exists and its amount of columns and rows is fixed from now on, until the admin opens the eevnt again. Participants who joined on a close event will be alocated on a column and row with the closest geolocation to them.

Once the event is closed, the admin can send through websockets predefined effects commands that will be redirected to the participants. Each participant calculates each own state according to the received instructions. This means that Pollo does not have a frame rate and all participants are notified only when the event current effect state changes


---


📬 Contact <a name="contact"></a>
📧 Tobias Cadoná Marion — contato@tobiasmarion.com

Made with 💜 by Tobias
