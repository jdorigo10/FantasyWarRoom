import tkinter as tk
from tkinter import ttk, messagebox
import random
import time
import threading

# Fantasy WarRoom v2.2 - Modern Tactical Interface
# Designed for high-performance draft analysis

class ModernWarRoomApp:
    def __init__(self, root):
        self.root = root
        self.root.title("FANTASY WARROOM v2.2")
        self.root.geometry("1100x750")
        self.root.configure(bg="#0f1115")  # Deep space gray/black

        # Modern Palette
        self.colors = {
            "bg": "#0f1115",
            "sidebar": "#161b22",
            "card": "#1c2128",
            "accent": "#2ea043",  # High-vis green
            "text": "#adbac7",
            "text_bright": "#ffffff",
            "border": "#30363d",
            "danger": "#f85149"
        }

        self.mock_players = [
            {"name": "Christian McCaffrey", "pos": "RB", "team": "SF", "proj": 340.5, "adp": 1.1, "tier": 1},
            {"name": "CeeDee Lamb", "pos": "WR", "team": "DAL", "proj": 322.8, "adp": 2.4, "tier": 1},
            {"name": "Tyreek Hill", "pos": "WR", "team": "MIA", "proj": 315.2, "adp": 3.7, "tier": 1},
            {"name": "Josh Allen", "pos": "QB", "team": "BUF", "proj": 412.5, "adp": 21.8, "tier": 1},
            {"name": "Justin Jefferson", "pos": "WR", "team": "MIN", "proj": 308.1, "adp": 5.2, "tier": 1},
            {"name": "Breece Hall", "pos": "RB", "team": "NYJ", "proj": 298.4, "adp": 6.3, "tier": 1},
            {"name": "Amon-Ra St. Brown", "pos": "WR", "team": "DET", "proj": 302.7, "adp": 8.5, "tier": 1},
            {"name": "Patrick Mahomes", "pos": "QB", "team": "KC", "proj": 398.9, "adp": 32.1, "tier": 1},
            {"name": "Sam LaPorta", "pos": "TE", "team": "DET", "proj": 235.4, "adp": 34.6, "tier": 1},
            {"name": "Bijan Robinson", "pos": "RB", "team": "ATL", "proj": 292.1, "adp": 7.8, "tier": 1},
        ]
        
        self.my_roster = []
        self.setup_styles()
        self.show_init_screen()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Treeview styling
        style.configure("Treeview", 
                        background=self.colors["card"], 
                        foreground=self.colors["text"], 
                        fieldbackground=self.colors["card"], 
                        borderwidth=0,
                        font=("Segoe UI", 10),
                        rowheight=35)
        style.configure("Treeview.Heading", 
                        background=self.colors["sidebar"], 
                        foreground=self.colors["accent"], 
                        font=("Segoe UI", 9, "bold"),
                        borderwidth=0)
        style.map("Treeview", background=[('selected', '#21262d')])
        
        # Progressbar
        style.configure("TProgressbar", thickness=4, troughcolor=self.colors["bg"], background=self.colors["accent"])

    def show_init_screen(self):
        self.init_frame = tk.Frame(self.root, bg=self.colors["bg"])
        self.init_frame.place(relx=0, rely=0, relwidth=1, relheight=1)

        center_content = tk.Frame(self.init_frame, bg=self.colors["bg"])
        center_content.place(relx=0.5, rely=0.5, anchor="center")

        tk.Label(center_content, text="FANTASY WARROOM", font=("Impact", 36), fg=self.colors["accent"], bg=self.colors["bg"]).pack()
        tk.Label(center_content, text="TACTICAL DRAFT INTELLIGENCE v2.2", font=("Courier", 10), fg=self.colors["text"], bg=self.colors["bg"]).pack(pady=(0, 40))

        self.status_var = tk.StringVar(value="[ STANDBY ] INITIALIZING NODE...")
        tk.Label(center_content, textvariable=self.status_var, font=("Courier", 9), fg=self.colors["text"], bg=self.colors["bg"]).pack()

        self.progress = ttk.Progressbar(center_content, length=400, mode='determinate', style="TProgressbar")
        self.progress.pack(pady=20)

        # Log output simulation
        self.log_text = tk.Text(center_content, height=6, width=60, bg="#0d1117", fg="#6e7681", borderwidth=0, font=("Consolas", 8))
        self.log_text.pack(pady=10)

        threading.Thread(target=self.init_sequence, daemon=True).start()

    def add_log(self, msg):
        self.log_text.insert("end", f"> {msg}\n")
        self.log_text.see("end")

    def init_sequence(self):
        tasks = [
            ("ESTABLISHING ESPN API HANDSHAKE...", 0.1),
            ("FETCHING 2026 PLAYER PROJECTIONS...", 0.3),
            ("CALCULATING POSITION SCARCITY METRICS...", 0.5),
            ("LOADING 5-YEAR INJURY TREND MODELS...", 0.7),
            ("GENERATING OPTIMAL DRAFT PATHS...", 0.9),
            ("WARROOM ACTIVE.", 1.0)
        ]
        for msg, p in tasks:
            time.sleep(random.uniform(0.5, 1.2))
            self.status_var.set(f"[ BUSY ] {msg}")
            self.progress['value'] = p * 100
            self.add_log(msg)
        
        time.sleep(0.5)
        self.root.after(0, self.setup_main_ui)

    def setup_main_ui(self):
        self.init_frame.destroy()
        
        # Sidebar
        self.sidebar = tk.Frame(self.root, bg=self.colors["sidebar"], width=220)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        # App Logo in Sidebar
        tk.Label(self.sidebar, text="FANTASY", font=("Impact", 18), fg=self.colors["text_bright"], bg=self.colors["sidebar"]).pack(pady=(20, 0))
        tk.Label(self.sidebar, text="WARROOM", font=("Impact", 18), fg=self.colors["accent"], bg=self.colors["sidebar"]).pack()

        # Nav Buttons
        nav_items = [("DRAFT TOOL", True), ("PLAYER BOARD", False), ("ROSTER VIEW", False), ("SETTINGS", False)]
        for text, active in nav_items:
            btn = tk.Button(self.sidebar, text=text, font=("Segoe UI", 9, "bold"), bg=self.colors["sidebar"] if not active else "#21262d", 
                           fg=self.colors["text"] if not active else self.colors["accent"], borderwidth=0, padx=20, pady=10, 
                           anchor="w", activebackground="#30363d", activeforeground="white", relief="flat")
            btn.pack(fill="x", pady=1)

        # Main Content
        self.main_area = tk.Frame(self.root, bg=self.colors["bg"])
        self.main_area.pack(side="right", fill="both", expand=True)

        # Header with Stats
        self.header = tk.Frame(self.main_area, bg=self.colors["bg"], height=80)
        self.header.pack(fill="x", padx=20, pady=20)
        
        stat_frame = tk.Frame(self.header, bg=self.colors["bg"])
        stat_frame.pack(side="left")
        tk.Label(stat_frame, text="CURRENT PICK", font=("Segoe UI", 8, "bold"), fg=self.colors["text"], bg=self.colors["bg"]).pack(anchor="w")
        tk.Label(stat_frame, text="ROUND 1 / #1", font=("Segoe UI", 24, "bold"), fg=self.colors["accent"], bg=self.colors["bg"]).pack(anchor="w")

        # Command Center - Player Table
        self.table_container = tk.Frame(self.main_area, bg=self.colors["card"], borderwidth=1, relief="flat")
        self.table_container.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        table_header = tk.Frame(self.table_container, bg=self.colors["sidebar"], pady=10, px=10)
        table_header.pack(fill="x")
        tk.Label(table_header, text="PLAYER ANALYSIS ENGINE", font=("Segoe UI", 9, "bold"), fg=self.colors["text_bright"], bg=self.colors["sidebar"]).pack(side="left")
        
        self.tree = ttk.Treeview(self.table_container, columns=("Name", "Pos", "Team", "Proj", "ADP"), show="headings", style="Treeview")
        self.tree.heading("Name", text="PLAYER")
        self.tree.heading("Pos", text="POSITION")
        self.tree.heading("Team", text="TEAM")
        self.tree.heading("Proj", text="PROJ PTS")
        self.tree.heading("ADP", text="ADP")
        
        self.tree.column("Name", width=250)
        self.tree.column("Pos", width=100, anchor="center")
        self.tree.column("Team", width=100, anchor="center")
        self.tree.column("Proj", width=120, anchor="e")
        self.tree.column("ADP", width=100, anchor="e")

        for p in self.mock_players:
            self.tree.insert("", "end", values=(p['name'], p['pos'], p['team'], p['proj'], p['adp']))

        self.tree.pack(fill="both", expand=True)

        # Action Bar
        self.action_bar = tk.Frame(self.main_area, bg=self.colors["bg"], pady=10)
        self.action_bar.pack(fill="x", padx=20)

        tk.Button(self.action_bar, text="DRAFT PLAYER", font=("Segoe UI", 10, "bold"), bg=self.colors["accent"], fg="black", 
                  padx=20, pady=8, relief="flat", command=self.draft_player).pack(side="left")
        
        tk.Button(self.action_bar, text="UNDO PICK", font=("Segoe UI", 10, "bold"), bg=self.colors["sidebar"], fg=self.colors["text"], 
                  padx=20, pady=8, relief="flat", borderwidth=1).pack(side="left", padx=10)

        # Roster Status Footer
        self.footer = tk.Frame(self.main_area, bg=self.colors["sidebar"], height=40)
        self.footer.pack(fill="x", side="bottom")
        tk.Label(self.footer, text="SYSTEM STATUS: OPTIMAL | ROSTER: 0/15 | PROJ POINTS: 0", font=("Consolas", 8), 
                 fg=self.colors["accent"], bg=self.colors["sidebar"], padx=10).pack(side="left")

    def draft_player(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Target Selection", "NO PLAYER SELECTED. SELECT TARGET FIRST.")
            return
        
        player_name = self.tree.item(selected[0])['values'][0]
        messagebox.showinfo("WarRoom Success", f"MISSION ACCOMPLISHED: {player_name} DRAFTED.")
        self.tree.delete(selected[0])

if __name__ == "__main__":
    root = tk.Tk()
    app = ModernWarRoomApp(root)
    root.mainloop()
