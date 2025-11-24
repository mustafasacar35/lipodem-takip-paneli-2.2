/**
 * Supabase Browser Shim
 * Tarayıcıda çalışan basit Supabase client wrapper
 * CDN olmadan çalışır
 */

(function() {
    'use strict';
    
    // Basit fetch wrapper
    class SupabaseClient {
        constructor(supabaseUrl, supabaseKey) {
            this.supabaseUrl = supabaseUrl.replace(/\/$/, ''); // Trailing slash kaldır
            this.supabaseKey = supabaseKey;
            this.headers = {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            };
        }
        
        from(table) {
            return new SupabaseQueryBuilder(this, table);
        }
    }
    
    class SupabaseQueryBuilder {
        constructor(client, table) {
            this.client = client;
            this.table = table;
            this.filters = [];
            this.selectedColumns = '*';
            this.orderBy = null;
            this.limitCount = null;
        }
        
        select(columns = '*') {
            this.selectedColumns = columns;
            return this;
        }
        
        eq(column, value) {
            this.filters.push(`${column}=eq.${value}`);
            return this;
        }
        
        order(column, options = {}) {
            const direction = options.ascending === false ? 'desc' : 'asc';
            this.orderBy = `${column}.${direction}`;
            return this;
        }
        
        limit(count) {
            this.limitCount = count;
            return this;
        }
        
        async _execute(method = 'GET', body = null) {
            try {
                let url = `${this.client.supabaseUrl}/rest/v1/${this.table}`;
                
                // Query parameters ekle
                const params = new URLSearchParams();
                params.append('select', this.selectedColumns);
                
                if (this.filters.length > 0) {
                    this.filters.forEach(filter => {
                        const [column, value] = filter.split('=');
                        params.append(column, value);
                    });
                }
                
                if (this.orderBy) {
                    params.append('order', this.orderBy);
                }
                
                if (this.limitCount !== null) {
                    params.append('limit', this.limitCount);
                }
                
                url += '?' + params.toString();
                
                const options = {
                    method: method,
                    headers: this.client.headers
                };
                
                if (body && (method === 'POST' || method === 'PATCH')) {
                    options.body = JSON.stringify(body);
                }
                
                console.log('[SupabaseShim] Request:', method, url);
                
                const response = await fetch(url, options);
                const data = await response.json();
                
                if (!response.ok) {
                    console.error('[SupabaseShim] Error:', data);
                    return { data: null, error: data };
                }
                
                console.log('[SupabaseShim] Success:', data);
                return { data: data, error: null };
                
            } catch (error) {
                console.error('[SupabaseShim] Fetch error:', error);
                return { data: null, error: error };
            }
        }
        
        // SELECT - GET request
        async then(resolve, reject) {
            const result = await this._execute('GET');
            if (resolve) resolve(result);
            return result;
        }
        
        // INSERT
        async insert(data) {
            const result = await this._execute('POST', data);
            return result;
        }
        
        // UPDATE
        async update(data) {
            const result = await this._execute('PATCH', data);
            return result;
        }
        
        // UPSERT
        async upsert(data, options = {}) {
            const headers = { ...this.client.headers };
            
            if (options.onConflict) {
                headers['Prefer'] = `resolution=merge-duplicates`;
            }
            
            const url = `${this.client.supabaseUrl}/rest/v1/${this.table}`;
            const params = new URLSearchParams({ select: this.selectedColumns });
            
            if (options.onConflict) {
                params.append('on_conflict', options.onConflict);
            }
            
            try {
                const response = await fetch(url + '?' + params.toString(), {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(data)
                });
                
                const responseData = await response.json();
                
                if (!response.ok) {
                    console.error('[SupabaseShim] Upsert error:', responseData);
                    return { data: null, error: responseData };
                }
                
                console.log('[SupabaseShim] Upsert success:', responseData);
                return { data: responseData, error: null };
                
            } catch (error) {
                console.error('[SupabaseShim] Upsert fetch error:', error);
                return { data: null, error: error };
            }
        }
        
        // DELETE
        async delete() {
            const result = await this._execute('DELETE');
            return result;
        }
    }
    
    // Global expose
    window.supabase = {
        createClient: function(url, key) {
            console.log('[SupabaseShim] Creating client:', url);
            return new SupabaseClient(url, key);
        }
    };
    
    console.log('[SupabaseShim] ✅ Supabase browser shim loaded');
    
})();
