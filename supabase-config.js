// 🗄️ SUPABASE KONFIGURACE
// 1. Jděte na https://supabase.com/
// 2. Klikněte "Start your project"
// 3. Vytvořte nový projekt
// 4. Zkopírujte URL a anon key

const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
    }

    async call(method, endpoint, data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.key}`,
                'apikey': this.key
            }
        };

        if (data) options.body = JSON.stringify(data);

        try {
            const response = await fetch(`${this.url}/rest/v1${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error('Supabase chyba:', error);
            return null;
        }
    }

    // Uživatelé
    async createUser(username, password, email) {
        return this.call('POST', '/users', { 
            username, 
            password_hash: btoa(password),
            email,
            created_at: new Date().toISOString()
        });
    }

    async getUser(username) {
        return this.call('GET', `/users?username=eq.${username}`);
    }

    // Nákupy
    async savePurchase(userId, planId, planName, price) {
        return this.call('POST', '/purchases', {
            user_id: userId,
            plan_id: planId,
            plan_name: planName,
            price,
            purchased_at: new Date().toISOString()
        });
    }

    async getPurchases(userId) {
        return this.call('GET', `/purchases?user_id=eq.${userId}`);
    }

    // Profil
    async updateProfile(userId, profileData) {
        return this.call('PATCH', `/users/${userId}`, profileData);
    }
}

window.supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Supabase připojen!");
