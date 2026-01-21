import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox
import random
import time
import threading

# Fantasy WarRoom v2.4 - Tactical Intelligence Suite
# Powered by ESPN Data Integration (Mocked)

class FantasyWarRoomApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Setup
        self.title("FANTASY WARROOM v2.4")
        self.geometry("1200x800")
        
        # Theme configuration
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("green")

        self.colors = {
            "bg": "#0f1115",
            "sidebar": "#161b22",
            "card": "#1c2128",
            "accent": "#2ea043",
            "text": "#adbac7",
            "text_bright": "#ffffff",
            "danger": "#f85149",
            "border": "#30363d"
        }

        # Mock Data Structure representing ESPN Sources
        self.espn_data = {
            "rankings": [],
            "adp": {},
            "projections": {},
            "trends": {}
        }
        
        self.my_roster = []
        self.show_init_screen()

    def show_init_screen(self):
        self.init_frame = ctk.CTkFrame(self, fg_color=self.colors["bg"])
        self.init_frame.pack(fill="both", expand=True)

        center_content = ctk.CTkFrame(self.init_frame, fg_color="transparent")
        center_content.place(relx=0.5, rely=0.5, anchor="center")

        title_label = ctk.CTkLabel(center_content, text="FANTASY WARROOM", font=("Impact", 56), text_color=self.colors["accent"])
        title_label.pack()

        subtitle_label = ctk.CTkLabel(center_content, text="ESPN DATA SYNCHRONIZATION ENGINE", font=("Courier", 14), text_color=self.colors["text"])
        subtitle_label.pack(pady=(0, 50))

        self.status_var = tk.StringVar(value="[ STANDBY ] INITIALIZING HANDSHAKE...")
        status_label = ctk.CTkLabel(center_content, textvariable=self.status_var, font=("Courier", 12), text_color=self.colors["text"])
        status_label.pack()

        self.progress = ctk.CTkProgressBar(center_content, width=500, height=12, progress_color=self.colors["accent"])
        self.progress.set(0)
        self.progress.pack(pady=25)

        self.log_textbox = ctk.CTkTextbox(center_content, height=150, width=600, font=("Consolas", 11), fg_color="#0d1117", text_color="#6e7681", border_width=1, border_color=self.colors["border"])
        self.log_textbox.pack(pady=10)

        threading.Thread(target=self.init_sequence, daemon=True).start()

    def add_log(self, msg):
        self.log_textbox.insert("end", f"[{time.strftime('%H:%M:%S')}] > {msg}\n")
        self.log_textbox.see("end")

    def init_sequence(self):
        # Simulation of ESPN data scraping/fetching
        tasks = [
            ("LOCATING ESPN ENDPOINTS (fantasy.espn.com)...", 0.05),
            ("BYPASSING GATEWAYS & ESTABLISHING SESSION...", 0.15),
            ("SCRAPING LIVE DRAFT RESULTS (ADP)...", 0.30),
            ("DOWNLOADING 2026 PLAYER RANKINGS...", 0.45),
            ("SCANNING ESPN INSIDER PROJECTIONS...", 0.60),
            ("FETCHING TEAM STRENGTH OF SCHEDULE (SOS)...", 0.75),
            ("ANALYZING 5-YEAR PERFORMANCE TRENDS...", 0.90),
            ("WARROOM FULLY OPERATIONAL. DEPLOYING GUI.", 1.0)
        ]
        
        for msg, p in tasks:
            time.sleep(random.uniform(0.6, 1.2))
            self.status_var.set(f"[ BUSY ] {msg}")
            self.progress.set(p)
            self.add_log(msg)
            
            # Populate mock data as we "load"
            if p == 0.45:
                self.load_mock_data()
        
        time.sleep(1.0)
        self.after(0, self.setup_main_ui)

    def load_mock_data(self):
        # This mirrors the ESPN-based data structure
        self.espn_data["rankings"] = [
            {"name": "Christian McCaffrey", "pos": "RB", "team": "SF", "proj": 340.5, "adp": 1.1, "trend": "+0.1", "risk": "Low"},
            {"name": "CeeDee Lamb", "pos": "WR", "team": "DAL", "proj": 322.8, "adp": 2.4, "trend": "-0.2", "risk": "Low"},
            {"name": "Tyreek Hill", "pos": "WR", "team": "MIA", "proj": 315.2, "adp": 3.7, "trend": "Stable", "risk": "Med"},
            {"name": "Josh Allen", "pos": "QB", "team": "BUF", "proj": 412.5, "adp": 21.8, "trend": "+1.2", "risk": "Low"},
            {"name": "Justin Jefferson", "pos": "WR", "team": "MIN", "proj": 308.1, "adp": 5.2, "trend": "Stable", "risk": "Low"},
            {"name": "Breece Hall", "pos": "RB", "team": "NYJ", "proj": 298.4, "adp": 6.3, "trend": "+0.5", "risk": "Med"},
            {"name": "Amon-Ra St. Brown", "pos": "WR", "team": "DET", "proj": 302.7, "adp": 8.5, "trend": "Stable", "risk": "Low"},
            {"name": "Patrick Mahomes", "pos": "QB", "team": "KC", "proj": 398.9, "adp": 32.1, "trend": "Stable", "risk": "Low"},
            {"name": "Sam LaPorta", "pos": "TE", "team": "DET", "proj": 235.4, "adp": 34.6, "trend": "+2.1", "risk": "Low"},
            {"name": "Bijan Robinson", "pos": "RB", "team": "ATL", "proj": 292.1, "adp": 7.8, "trend": "-0.4", "risk": "Low"},
        ]

    def setup_main_ui(self):
        self.init_frame.destroy()
        
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Sidebar
        self.sidebar = ctk.CTkFrame(self, width=240, corner_radius=0, fg_color=self.colors["sidebar"])
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        
        logo_label = ctk.CTkLabel(self.sidebar, text="WARROOM", font=("Impact", 32), text_color=self.colors["accent"])
        logo_label.pack(pady=40)

        nav_buttons = [
            ("DRAFT TOOL", "LayoutDashboard"),
            ("PLAYER BOARD", "Grid3X3"),
            ("ROSTER VIEW", "Users"),
            ("MARKET TRENDS", "BarChart3"),
            ("SETTINGS", "Settings")
        ]
        for btn_text, icon in nav_buttons:
            btn = ctk.CTkButton(self.sidebar, text=btn_text, font=("Segoe UI", 12, "bold"), 
                               fg_color="transparent", text_color=self.colors["text"],
                               hover_color="#21262d", anchor="w", height=50)
            btn.pack(fill="x", padx=15, pady=2)

        # Main Area
        self.main_area = ctk.CTkFrame(self, corner_radius=0, fg_color=self.colors["bg"])
        self.main_area.grid(row=0, column=1, sticky="nsew", padx=25, pady=25)

        # Header with ESPN Source Tag
        header_frame = ctk.CTkFrame(self.main_area, fg_color="transparent")
        header_frame.pack(fill="x", pady=(0, 25))
        
        title_box = ctk.CTkFrame(header_frame, fg_color="transparent")
        title_box.pack(side="left")
        
        pick_label = ctk.CTkLabel(title_box, text="ON THE CLOCK: ROUND 1 / #1", font=("Segoe UI", 28, "bold"), text_color=self.colors["accent"])
        pick_label.pack(anchor="w")
        
        source_badge = ctk.CTkLabel(title_box, text="SOURCE: ESPN LIVE ADP SYNCHRONIZED", font=("Courier", 10), text_color="#6e7681")
        source_badge.pack(anchor="w")

        # Tab View for different perspectives
        self.tabview = ctk.CTkTabview(self.main_area, fg_color=self.colors["card"], segmented_button_selected_color=self.colors["accent"])
        self.tabview.pack(fill="both", expand=True)
        
        self.tab_tool = self.tabview.add("DRAFT ENGINE")
        self.tab_board = self.tabview.add("ADVANCED ANALYTICS")
        
        # --- DRAFT ENGINE TAB ---
        self.setup_draft_tab()
        
        # --- ANALYTICS TAB ---
        self.setup_analytics_tab()

    def setup_draft_tab(self):
        # Player Table inside Draft Engine
        style = tk.ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview", background="#1c2128", foreground="#adbac7", fieldbackground="#1c2128", borderwidth=0, font=("Segoe UI", 10), rowheight=40)
        style.configure("Treeview.Heading", background="#161b22", foreground="#2ea043", font=("Segoe UI", 11, "bold"), borderwidth=0)
        
        self.tree = tk.ttk.Treeview(self.tab_tool, columns=("Name", "Pos", "Team", "Proj", "ADP", "Trend"), show="headings")
        self.tree.heading("Name", text="ESPN PLAYER NAME")
        self.tree.heading("Pos", text="POS")
        self.tree.heading("Team", text="TEAM")
        self.tree.heading("Proj", text="PROJ PTS")
        self.tree.heading("ADP", text="ESPN ADP")
        self.tree.heading("Trend", text="TREND")
        
        self.tree.column("Name", width=250)
        self.tree.column("Pos", width=80, anchor="center")
        self.tree.column("Team", width=80, anchor="center")
        self.tree.column("Proj", width=100, anchor="e")
        self.tree.column("ADP", width=100, anchor="e")
        self.tree.column("Trend", width=80, anchor="center")

        for p in self.espn_data["rankings"]:
            self.tree.insert("", "end", values=(p['name'], p['pos'], p['team'], p['proj'], p['adp'], p['trend']))

        self.tree.pack(fill="both", expand=True, padx=15, pady=15)

        # Action Buttons
        action_frame = ctk.CTkFrame(self.tab_tool, fg_color="transparent")
        action_frame.pack(fill="x", pady=15, padx=15)

        draft_btn = ctk.CTkButton(action_frame, text="EXECUTE STRATEGIC PICK", font=("Segoe UI", 14, "bold"), 
                                 fg_color=self.colors["accent"], text_color="black", height=50, command=self.draft_player)
        draft_btn.pack(side="left", padx=(0, 15))

        sim_btn = ctk.CTkButton(action_frame, text="SIMULATE CPU PICK", font=("Segoe UI", 14, "bold"), 
                                fg_color=self.colors["sidebar"], text_color=self.colors["text"], height=50)
        sim_btn.pack(side="left")

    def setup_analytics_tab(self):
        # Insights Panel
        insights_frame = ctk.CTkFrame(self.tab_board, fg_color="transparent")
        insights_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        ctk.CTkLabel(insights_frame, text="PREDICTIVE VALUE ANALYSIS", font=("Segoe UI", 18, "bold"), text_color=self.colors["accent"]).pack(anchor="w", pady=(0, 20))
        
        # Mock Metric Cards
        metrics = [
            ("POSITIONAL SCARCITY (RB)", "CRITICAL", self.colors["danger"]),
            ("VALUE OVER REPLACEMENT (QB)", "OPTIMAL", self.colors["accent"]),
            ("BYE WEEK CONGESTION", "NOMINAL", self.colors["text"])
        ]
        
        for label, val, color in metrics:
            m_card = ctk.CTkFrame(insights_frame, fg_color=self.colors["sidebar"], height=60)
            m_card.pack(fill="x", pady=5)
            ctk.CTkLabel(m_card, text=label, font=("Segoe UI", 12), text_color=self.colors["text"]).pack(side="left", padx=20)
            ctk.CTkLabel(m_card, text=val, font=("Segoe UI", 14, "bold"), text_color=color).pack(side="right", padx=20)

    def draft_player(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("System Alert", "NO TARGET IDENTIFIED. SELECT PLAYER.")
            return
        
        p_name = self.tree.item(selected[0])['values'][0]
        messagebox.showinfo("Roster Updated", f"{p_name} SECURED IN WARROOM.")
        self.tree.delete(selected[0])

if __name__ == "__main__":
    app = FantasyWarRoomApp()
    app.mainloop()
