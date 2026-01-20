import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox
import random
import time
import threading

# Fantasy WarRoom v2.3 - Ultra-Modern CustomTkinter Interface
# Designed for peak performance and tactical aesthetics

class FantasyWarRoomApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Setup
        self.title("FANTASY WARROOM v2.3")
        self.geometry("1100x750")
        
        # Theme configuration
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("green")  # Tactical green theme

        self.colors = {
            "bg": "#0f1115",
            "sidebar": "#161b22",
            "card": "#1c2128",
            "accent": "#2ea043",
            "text": "#adbac7",
            "text_bright": "#ffffff",
            "danger": "#f85149"
        }

        self.mock_players = [
            {"name": "Christian McCaffrey", "pos": "RB", "team": "SF", "proj": 340.5, "adp": 1.1},
            {"name": "CeeDee Lamb", "pos": "WR", "team": "DAL", "proj": 322.8, "adp": 2.4},
            {"name": "Tyreek Hill", "pos": "WR", "team": "MIA", "proj": 315.2, "adp": 3.7},
            {"name": "Josh Allen", "pos": "QB", "team": "BUF", "proj": 412.5, "adp": 21.8},
            {"name": "Justin Jefferson", "pos": "WR", "team": "MIN", "proj": 308.1, "adp": 5.2},
            {"name": "Breece Hall", "pos": "RB", "team": "NYJ", "proj": 298.4, "adp": 6.3},
            {"name": "Amon-Ra St. Brown", "pos": "WR", "team": "DET", "proj": 302.7, "adp": 8.5},
            {"name": "Patrick Mahomes", "pos": "QB", "team": "KC", "proj": 398.9, "adp": 32.1},
            {"name": "Sam LaPorta", "pos": "TE", "team": "DET", "proj": 235.4, "adp": 34.6},
            {"name": "Bijan Robinson", "pos": "RB", "team": "ATL", "proj": 292.1, "adp": 7.8},
        ]

        self.show_init_screen()

    def show_init_screen(self):
        self.init_frame = ctk.CTkFrame(self, fg_color=self.colors["bg"])
        self.init_frame.pack(fill="both", expand=True)

        center_content = ctk.CTkFrame(self.init_frame, fg_color="transparent")
        center_content.place(relx=0.5, rely=0.5, anchor="center")

        title_label = ctk.CTkLabel(center_content, text="FANTASY WARROOM", font=("Impact", 48), text_color=self.colors["accent"])
        title_label.pack()

        subtitle_label = ctk.CTkLabel(center_content, text="ADVANCED TACTICAL INTERFACE", font=("Courier", 12), text_color=self.colors["text"])
        subtitle_label.pack(pady=(0, 40))

        self.status_var = tk.StringVar(value="[ STANDBY ] INITIALIZING SYSTEMS...")
        status_label = ctk.CTkLabel(center_content, textvariable=self.status_var, font=("Courier", 10), text_color=self.colors["text"])
        status_label.pack()

        self.progress = ctk.CTkProgressBar(center_content, width=400, height=10, progress_color=self.colors["accent"])
        self.progress.set(0)
        self.progress.pack(pady=20)

        self.log_textbox = ctk.CTkTextbox(center_content, height=100, width=500, font=("Consolas", 10), fg_color="#0d1117", text_color="#6e7681")
        self.log_textbox.pack(pady=10)

        threading.Thread(target=self.init_sequence, daemon=True).start()

    def add_log(self, msg):
        self.log_textbox.insert("end", f"> {msg}\n")
        self.log_textbox.see("end")

    def init_sequence(self):
        tasks = [
            ("ESTABLISHING ESPN DATA HANDSHAKE...", 0.1),
            ("PULLING 2026 PLAYER PROJECTIONS...", 0.3),
            ("SYNCING HISTORICAL TREND MODELS...", 0.5),
            ("CALCULATING VALUE OVER REPLACEMENT...", 0.7),
            ("GENERATING TACTICAL RECOMMENDATIONS...", 0.9),
            ("WARROOM FULLY OPERATIONAL.", 1.0)
        ]
        for msg, p in tasks:
            time.sleep(random.uniform(0.4, 0.8))
            self.status_var.set(f"[ BUSY ] {msg}")
            self.progress.set(p)
            self.add_log(msg)
        
        time.sleep(0.5)
        self.after(0, self.setup_main_ui)

    def setup_main_ui(self):
        self.init_frame.destroy()
        
        # Grid layout configuration
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Sidebar
        self.sidebar = ctk.CTkFrame(self, width=220, corner_radius=0, fg_color=self.colors["sidebar"])
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        
        logo_label = ctk.CTkLabel(self.sidebar, text="WARROOM", font=("Impact", 28), text_color=self.colors["accent"])
        logo_label.pack(pady=30)

        nav_buttons = ["DRAFT TOOL", "DRAFT BOARD", "ROSTER VIEW", "SETTINGS"]
        for btn_text in nav_buttons:
            btn = ctk.CTkButton(self.sidebar, text=btn_text, font=("Segoe UI", 11, "bold"), 
                               fg_color="transparent", text_color=self.colors["text"],
                               hover_color="#21262d", anchor="w", height=45)
            btn.pack(fill="x", padx=10, pady=2)

        # Main Area
        self.main_area = ctk.CTkFrame(self, corner_radius=0, fg_color=self.colors["bg"])
        self.main_area.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)

        # Header
        header_frame = ctk.CTkFrame(self.main_area, fg_color="transparent")
        header_frame.pack(fill="x", pady=(0, 20))
        
        pick_label = ctk.CTkLabel(header_frame, text="ON THE CLOCK: ROUND 1 / #1", font=("Segoe UI", 24, "bold"), text_color=self.colors["accent"])
        pick_label.pack(side="left")

        # Player Table Container
        self.table_frame = ctk.CTkFrame(self.main_area, fg_color=self.colors["card"], border_width=1, border_color=self.colors["border"])
        self.table_frame.pack(fill="both", expand=True)

        # Using standard TK treeview for the data grid inside CTK frame
        style = tk.ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview", background="#1c2128", foreground="#adbac7", fieldbackground="#1c2128", borderwidth=0, font=("Segoe UI", 10), rowheight=35)
        style.configure("Treeview.Heading", background="#161b22", foreground="#2ea043", font=("Segoe UI", 10, "bold"), borderwidth=0)
        
        self.tree = tk.ttk.Treeview(self.table_frame, columns=("Name", "Pos", "Team", "Proj", "ADP"), show="headings")
        self.tree.heading("Name", text="PLAYER")
        self.tree.heading("Pos", text="POS")
        self.tree.heading("Team", text="TEAM")
        self.tree.heading("Proj", text="PROJ")
        self.tree.heading("ADP", text="ADP")
        
        self.tree.column("Name", width=200)
        self.tree.column("Pos", width=80, anchor="center")
        self.tree.column("Team", width=80, anchor="center")
        self.tree.column("Proj", width=100, anchor="e")
        self.tree.column("ADP", width=80, anchor="e")

        for p in self.mock_players:
            self.tree.insert("", "end", values=(p['name'], p['pos'], p['team'], p['proj'], p['adp']))

        self.tree.pack(fill="both", expand=True, padx=10, pady=10)

        # Action Buttons
        self.action_frame = ctk.CTkFrame(self.main_area, fg_color="transparent")
        self.action_frame.pack(fill="x", pady=20)

        draft_btn = ctk.CTkButton(self.action_frame, text="EXECUTE DRAFT PICK", font=("Segoe UI", 12, "bold"), 
                                 fg_color=self.colors["accent"], text_color="black", height=45, command=self.draft_player)
        draft_btn.pack(side="left", padx=(0, 10))

        undo_btn = ctk.CTkButton(self.action_frame, text="UNDO LAST ACTION", font=("Segoe UI", 12, "bold"), 
                                fg_color=self.colors["sidebar"], text_color=self.colors["text"], height=45)
        undo_btn.pack(side="left")

    def draft_player(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("System Alert", "NO TARGET SELECTED. SELECT PLAYER BEFORE EXECUTION.")
            return
        
        p_name = self.tree.item(selected[0])['values'][0]
        messagebox.showinfo("Deployment Success", f"{p_name} HAS BEEN ADDED TO YOUR ROSTER.")
        self.tree.delete(selected[0])

if __name__ == "__main__":
    app = FantasyWarRoomApp()
    app.mainloop()
