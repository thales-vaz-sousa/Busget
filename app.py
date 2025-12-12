# app.py

import os
from dotenv import load_dotenv
from flask import Flask, redirect, url_for, render_template, request, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_required, login_user, logout_user, current_user
from flask_dance.contrib.google import make_google_blueprint, google
from flask_mail import Mail
from datetime import datetime
from sqlalchemy import func

# Carrega variáveis de ambiente do .env
load_dotenv()

# --- Configuração do Flask ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'super-secret-default-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///budget_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- Configuração do Flask-Mail ---
app.config['MAIL_SERVER'] = 'smtp.gmail.com' # Exemplo
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

# Inicialização das Extensões
db = SQLAlchemy(app)
login_manager = LoginManager(app)
mail = Mail(app)

# --- Configuração do Google OAuth (Flask-Dance) ---
google_bp = make_google_blueprint(
    client_id=os.environ.get("GOOGLE_OAUTH_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET"),
    scope=["openid", "email", "profile"],
    redirect_to='google_login'
)
app.register_blueprint(google_bp, url_prefix="/login")

# --- Modelos do Banco de Dados ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(256), unique=True)
    email = db.Column(db.String(100), unique=True)
    username = db.Column(db.String(100))
    # Campo para Personalização do Dashboard
    dashboard_card_visibility = db.Column(db.Text, default="summary_chart,savings_goal,anomaly_alert")
    
class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow)
    description = db.Column(db.String(255))
    category = db.Column(db.String(50))
    is_paid = db.Column(db.Boolean, default=False) # Adicionado para 'Mark as Paid'
    
# Função de carregamento de usuário para Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# --- Rotas Básicas e de Login ---

@app.route("/")
@login_required
def index():
    # Rota principal (Dashboard) - Será renderizada pelo React no frontend
    # O Flask só precisa servir o index.html principal, que carrega o React
    return render_template('index.html')

@app.route("/login/google_login")
def google_login():
    # Lógica de callback após o login do Google (Flask-Dance)
    if not google.authorized:
        return redirect(url_for("google.login"))
    
    resp = google.get("/oauth2/v2/userinfo")
    if resp.ok:
        google_info = resp.json()
        google_id = google_info["id"]
        email = google_info["email"]
        
        user = db.session.scalar(db.select(User).filter_by(google_id=google_id))
        
        if user is None:
            # Novo usuário
            user = User(google_id=google_id, email=email, username=google_info["name"])
            db.session.add(user)
            db.session.commit()
            
        login_user(user)
        flash("Login bem-sucedido!", "success")
        return redirect(url_for("index"))

    return "Falha no login com o Google.", 500

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Você foi desconectado.", "info")
    return redirect(url_for("index"))

# --- Inicialização ---

with app.app_context():
    # Cria o banco de dados e as tabelas (se não existirem)
    db.create_all()

# O Gunicorn usará o objeto 'app'
# if __name__ == '__main__':
#     app.run(debug=True)