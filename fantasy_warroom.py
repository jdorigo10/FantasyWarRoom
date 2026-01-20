import json
import time
import random
import tkinter as tk
from tkinter import ttk, messagebox

# --- Mock Data Simulation ---
MOCK_PLAYERS = [
    {"name": "Christian McCaffrey", "pos": "RB", "team": "SF", "proj": 340.5, "adp": 1.2},
    {"name": "CeeDee Lamb", "pos": "WR", "team": "DAL", "proj": 320.1, "adp": 2.5},
    {"name": "Tyreek Hill", "pos": "WR", "team": "MIA", "proj": 315.4, "adp": 3.8},
    {"name": "Josh Allen", "pos": "QB", "team": "BUF", "proj": 410.2, "adp": 22.4},
    {"name": "Breece Hall", "pos": "RB", "team": "NYJ", "proj": 290.8, "adp": 6.1},
    {"name": "Justin Jefferson", "pos": "WR", "team": "MIN", "proj": 305.2, "adp": 5.4},
    {"name": "Amon-Ra St. Brown", "pos": "WR", "team": "DET", "proj": 300.7, "adp": 8.2},
    {"name": "Bijan Robinson", "pos": "RB", "team": "ATL", "proj": 285.4, "adp": 7.9},
    {"name": "Patrick Mahomes", "pos": "QB", "team": "KC", "proj": 395.1, "adp": 35.2},
    {"name": "Travis Kelce", "pos": "TE", "team": "KC", "proj": 240.2, "adp": 28.5},
]

class FantasyWarRoomApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Fantasy WarRoom v2.1")
        self.root.geometry("900x600")
        self.root.configure(bg="#1e1e1e")
        
        self.players = MOCK_PLAYERS
        self.roster = []
        
        self.setup_styles()
        self.show_loading_screen()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("Treeview", background="#252526", foreground="#d4d4d4", fieldbackground="#252526", borderwidth=0)
        style.map("Treeview", background=[('selected', '#37373d')])
        style.configure("TButton", padding=6, relief="flat", background="#15803d", foreground="white")

    def show_loading_screen(self):
        self.loading_frame = tk.Frame(self.root, bg="#1a1a1a")
        self.loading_frame.place(relx=0, rely=0, relwidth=1, relheight=1)
        
        lbl = tk.Label(self.loading_frame, text="FANTASY WARROOM", font=("Chakra Petch", 24, "bold"), fg="#22c55e", bg="#1a1a1a")
        lbl.pack(pady=(150, 20))
        
        self.status_lbl = tk.Label(self.loading_frame, text="Initializing Tactical Systems...", fg="#969696", bg="#1a1a1a")
        self.status_lbl.pack()
        
        self.progress = ttk.Progressbar(self.loading_frame, length=300, mode='determinate')
        self.progress.pack(pady=20)
        
        self.start_initialization()

    def start_initialization(self):
        steps = [
            "Syncing with ESPN API...",
            "Loading 5-year trend data...",
            "Analyzing injury probabilities...",
            "Calculating Value Over Replacement...",
            "WarRoom Ready."
        ]
        
        def run_step(idx):
            if idx < len(steps):
                self.status_lbl.config(text=steps[idx])
                self.progress['value'] = (idx + 1) * 20
                self.root.after(800, lambda: run_step(idx + 1))
            else:
                self.loading_frame.destroy()
                self.setup_main_ui()
        
        run_step(0)

    def setup_main_ui(self):
        # Sidebar
        sidebar = tk.Frame(self.root, bg="#252526", width=200)
        sidebar.pack(side="left", fill="y")
        
        tk.Label(sidebar, text="WARROOM", font=("Arial", 12, "bold"), fg="#22c55e", bg="#252526", pady=20).pack()
        
        for btn_text in ["Draft Tool", "Draft Board", "Roster", "Settings"]:
            tk.Button(sidebar, text=btn_text, bg="#252526", fg="#969696", relief="flat", borderwidth=0, activebackground="#37373d").pack(fill="x", pady=2)

        # Main Area
        main_content = tk.Frame(self.root, bg="#1e1e1e")
        main_content.pack(side="right", fill="both", expand=True, padx=20, pady=20)
        
        tk.Label(main_content, text="PLAYER ANALYSIS ENGINE", font=("Arial", 10, "bold"), fg="#22c55e", bg="#1e1e1e").pack(anchor="w")
        
        # Table
        self.tree = ttk.Treeview(main_content, columns=("Name", "Pos", "Team", "Proj", "ADP"), show="headings")
        self.tree.heading("Name", text="PLAYER")
        self.tree.heading("Pos", text="POS")
        self.tree.heading("Team", text="TEAM")
        self.tree.heading("Proj", text="PROJ PTS")
        self.tree.heading("ADP", text="ADP")
        
        for p in self.players:
            self.tree.insert("", "end", values=(p['name'], p['pos'], p['team'], p['proj'], p['adp']))
        
        self.tree.pack(fill="both", expand=True, pady=10)
        
        btn_frame = tk.Frame(main_content, bg="#1e1e1e")
        btn_frame.pack(fill="x")
        
        tk.Button(btn_frame, text="DRAFT SELECTED", bg="#22c55e", fg="black", command=self.draft_player).pack(side="left")
        tk.Button(btn_frame, text="SIM PICK", bg="#37373d", fg="white", command=self.sim_pick).pack(side="left", padx=10)

    def draft_player(self):
        selected = self.tree.selection()
        if selected:
            player_name = self.tree.item(selected[0])['values'][0]
            messagebox.showinfo("Drafted", f"Added {player_name} to your WarRoom Roster.")
            self.tree.delete(selected[0])
        else:
            messagebox.showwarning("Selection", "Select a player to draft.")

    def sim_pick(self):
        children = self.tree.get_children()
        if children:
            target = random.choice(children)
            player_name = self.tree.item(target)['values'][0]
            messagebox.showinfo("CPU Pick", f"CPU drafted {player_name}")
            self.tree.delete(target)

if __name__ == "__main__":
    root = tk.Tk()
    app = FantasyWarRoomApp(root)
    root.mainloop()
