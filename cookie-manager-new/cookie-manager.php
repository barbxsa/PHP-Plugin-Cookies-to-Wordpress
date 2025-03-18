<?php
/**
 * Plugin Name: Gabriel Cookie Manager
 * Description: Gerenciador de cookies com popup de consentimento e painel de preferências...
 * Version: 0.2.1 Beta
 * Author: Gabriel Barbosa
 * Author URI: https://github.com/barbxsa
 */

if (!defined('ABSPATH')) {
    exit;
}

// Register activation hook
register_activation_hook(__FILE__, 'cookie_manager_activate');

function cookie_manager_activate() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'cookie_manager';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        cookie_name varchar(255) NOT NULL,
        cookie_description text NOT NULL,
        cookie_category varchar(50) NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Add admin menu
add_action('admin_menu', 'cookie_manager_admin_menu');

function cookie_manager_admin_menu() {
    add_menu_page(
        'Cookie Manager',
        'Cookie Manager',
        'manage_options',
        'cookie-manager',
        'cookie_manager_admin_page',
        'dashicons-privacy',
        30
    );
}

// Enqueue admin scripts and styles
add_action('admin_enqueue_scripts', 'cookie_manager_admin_scripts');

function cookie_manager_admin_scripts($hook) {
    if ($hook != 'toplevel_page_cookie-manager') {
        return;
    }
    
    wp_enqueue_style('cookie-manager-admin', plugins_url('css/admin.css', __FILE__));
    wp_enqueue_script('cookie-manager-admin', plugins_url('js/admin.js', __FILE__), array('jquery'), '1.0.0', true);
    wp_localize_script('cookie-manager-admin', 'cookieManagerAjax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('cookie-manager-nonce')
    ));
}


function cookie_manager_admin_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'cookie_manager';
    $cookies = $wpdb->get_results("SELECT * FROM $table_name");
    
    ?>
    <div class="wrap">
        <h1>Cookie Manager</h1>
        
        <div class="cookie-manager-container">
            <div class="cookie-list">
                <h2>Todos os Cookies</h2>
                <div id="detected-cookies">
                </div>
            </div>
            
            <div class="cookie-form">
                <h2>Adicionar/Editar Informações </h2>
                <form id="cookie-manager-form">
                    <input type="hidden" id="cookie-id" name="cookie_id">
                    
                    <div class="form-group">
                        <label for="cookie-name">Nome do Cookie</label>
                        <input type="text" id="cookie-name" name="cookie_name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="cookie-category">Categoria</label>
                        <select id="cookie-category" name="cookie_category" required>
                            <option value="necessary">Necessário</option>
                            <option value="performance">Performance</option>
                            <option value="functional">Funcional</option>
                            <option value="advertising">Publicidade</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="cookie-description">Descrição</label>
                        <textarea id="cookie-description" name="cookie_description" required></textarea>
                    </div>
                    
                    <button type="submit" class="button button-primary">Salvar</button>
                </form>
            </div>
            
            <div class="cookie-table">
                <h2>Cookies Definidos</h2>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Cookie</th>
                            <th>Categoria</th>
                            <th>Descrição</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody id="saved-cookies">
                        <?php foreach ($cookies as $cookie): ?>
                        <tr>
                            <td><?php echo esc_html($cookie->cookie_name); ?></td>
                            <td><?php echo esc_html($cookie->cookie_category); ?></td>
                            <td><?php echo esc_html($cookie->cookie_description); ?></td>
                            <td>
                                <button class="button edit-cookie" data-id="<?php echo $cookie->id; ?>">Editar</button>
                                <button class="button delete-cookie" data-id="<?php echo $cookie->id; ?>">Deletar</button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <?php
}

add_action('wp_ajax_save_cookie', 'cookie_manager_save_cookie');
add_action('wp_ajax_delete_cookie', 'cookie_manager_delete_cookie');
add_action('wp_ajax_get_detected_cookies', 'cookie_manager_get_detected_cookies');

function cookie_manager_save_cookie() {
    check_ajax_referer('cookie-manager-nonce', 'nonce');
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'cookie_manager';
    
    $cookie_id = isset($_POST['cookie_id']) ? intval($_POST['cookie_id']) : 0;
    $cookie_name = sanitize_text_field($_POST['cookie_name']);
    $cookie_category = sanitize_text_field($_POST['cookie_category']);
    $cookie_description = sanitize_textarea_field($_POST['cookie_description']);
    
    if ($cookie_id > 0) {
        $wpdb->update(
            $table_name,
            array(
                'cookie_name' => $cookie_name,
                'cookie_category' => $cookie_category,
                'cookie_description' => $cookie_description
            ),
            array('id' => $cookie_id)
        );
    } else {
        $wpdb->insert(
            $table_name,
            array(
                'cookie_name' => $cookie_name,
                'cookie_category' => $cookie_category,
                'cookie_description' => $cookie_description
            )
        );
    }
    
    wp_send_json_success();
}

function cookie_manager_delete_cookie() {
    check_ajax_referer('cookie-manager-nonce', 'nonce');
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'cookie_manager';
    
    $cookie_id = intval($_POST['cookie_id']);
    
    $wpdb->delete($table_name, array('id' => $cookie_id));
    
    wp_send_json_success();
}

function cookie_manager_get_detected_cookies() {
    check_ajax_referer('cookie-manager-nonce', 'nonce');
    
    $cookies = array();
    if (isset($_COOKIE)) {
        foreach ($_COOKIE as $name => $value) {
            $cookies[] = $name;
        }
    }
    
    wp_send_json_success($cookies);
}

// Add frontend scripts
add_action('wp_enqueue_scripts', 'cookie_manager_frontend_scripts');

function cookie_manager_frontend_scripts() {
    wp_enqueue_style('cookie-manager-frontend', plugins_url('css/frontend.css', __FILE__));
    wp_enqueue_script('cookie-manager-frontend', plugins_url('js/frontend.js', __FILE__), array('jquery'), '1.0.0', true);
    
    // Pass cookie data to frontend
    global $wpdb;
    $table_name = $wpdb->prefix . 'cookie_manager';
    $cookies = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);
    
    wp_localize_script('cookie-manager-frontend', 'cookieManagerData', array(
        'cookies' => $cookies
    ));
}

// Modal Vem aqui
add_action('wp_footer', 'cookie_manager_add_modal');

function cookie_manager_add_modal() {
    ?>
    <div class="fixed-cookie" id="cookie-ghbs-open">
        <svg fill="currentColor" height="2em" width="2em" style="display: inline-block; vertical-align: middle;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16.44 15.18"><path d="M6,15a.47.47,0,0,1-.35-.15,10.11,10.11,0,0,1-2-2.64A8.88,8.88,0,0,1,2.57,7.84,5.54,5.54,0,0,1,8.23,2.45a5.54,5.54,0,0,1,5.66,5.39.5.5,0,0,1-1,0A4.54,4.54,0,0,0,8.23,3.45,4.54,4.54,0,0,0,3.57,7.84a7.83,7.83,0,0,0,.93,3.85,9.47,9.47,0,0,0,1.85,2.42.51.51,0,0,1,0,.71A.55.55,0,0,1,6,15Zm7.17-1.85a5.39,5.39,0,0,1-3.1-.89A5.32,5.32,0,0,1,7.67,7.84a.5.5,0,1,1,1,0,4.3,4.3,0,0,0,1.94,3.56,4.38,4.38,0,0,0,2.54.71,6.61,6.61,0,0,0,1-.1.5.5,0,1,1,.17,1A6.83,6.83,0,0,1,13.15,13.12Zm-2,2.06-.13,0a7.8,7.8,0,0,1-3.72-2.1A7.3,7.3,0,0,1,5.12,7.84,3,3,0,0,1,8.2,4.9a3,3,0,0,1,3.08,2.94,2,2,0,0,0,2.08,1.94,2,2,0,0,0,2.08-1.94A7.05,7.05,0,0,0,8.19,1,7.3,7.3,0,0,0,1.58,5,6.43,6.43,0,0,0,1,7.84a9.94,9.94,0,0,0,.67,3.61.49.49,0,0,1-.29.64.5.5,0,0,1-.64-.29,11.14,11.14,0,0,1-.73-4A7.51,7.51,0,0,1,.68,4.6,8.3,8.3,0,0,1,8.19,0a8.06,8.06,0,0,1,8.25,7.83,3.08,3.08,0,0,1-6.16,0A2,2,0,0,0,8.2,5.89,2,2,0,0,0,6.12,7.83,6.3,6.3,0,0,0,8,12.34a6.8,6.8,0,0,0,3.27,1.85.5.5,0,0,1,.35.61A.49.49,0,0,1,11.14,15.18Z"></path></svg>
    </div>

    <div class="modal" id="modal_gerenciar_cookies" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Gerenciar Preferências de Cookies</h5>
                    <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close">X</button>
                </div>
                <div class="modal-body">
                    <div id="cookieManagerModal">
                        <ul class="lista-abas-cookies">
                            <li class="tab-link current" data-tab="tab-1">Preferências</li>
                            <li class="tab-link" data-tab="tab-2">Cookies</li>
                            <li><a href="<?php echo get_privacy_policy_url(); ?>" target="_blank">Aviso de Cookies</a></li>
                        </ul>

                        <div id="tab-1" class="tab-content current">
                            <p>Gostaríamos da sua permissão para utilizar os seus dados para os seguintes fins:</p>
                            <form id="cookiePreferencesForm">
                                <div class="caixa-checked-cookies">
                                    <div class="conteudo-caixa-checked">
                                        <h3>Necessário</h3>
                                        <p>Estes cookies são necessários para o bom funcionamento do nosso site e não podem ser desligados no nosso sistema.</p>
                                    </div>
                                    <div class="caixa-input">
                                        <input type="checkbox" name="necessario" checked disabled>
                                    </div>
                                </div>
                                <div class="caixa-checked-cookies">
                                    <div class="conteudo-caixa-checked">
                                        <h3>Desempenho</h3>
                                        <p>Utilizamos estes cookies para fornecer informações estatísticas sobre o nosso site - eles são usados para medir e melhorar o desempenho.</p>
                                    </div>
                                    <div class="caixa-input">
                                        <input type="checkbox" name="desempenho">
                                    </div>
                                </div>
                                <div class="caixa-checked-cookies">
                                    <div class="conteudo-caixa-checked">
                                        <h3>Funcional</h3>
                                        <p>Utilizamos estes cookies para melhorar a funcionalidade e permitir a personalização, tais como chats ao vivo, ferramentas de acessibilidades, vídeos e o uso de redes sociais.</p>
                                    </div>
                                    <div class="caixa-input">
                                        <input type="checkbox" name="funcional">
                                    </div>
                                </div>
                                <div class="caixa-checked-cookies">
                                    <div class="conteudo-caixa-checked">
                                        <h3>Publicidade</h3>
                                        <p>Utilizamos estes cookies para melhorar a funcionalidade e permitir a personalização, tais como chats ao vivo, vídeos e o uso de redes sociais.</p>
                                    </div>
                                    <div class="caixa-input">
                                        <input type="checkbox" name="publicidade">
                                    </div>
                                </div>

                                <div class="btns-cookies">
                                    <button type="submit">Salvar Preferências</button>
                                    <button type="button" id="rejectAllCookies">Rejeitar Todos</button>
                                    <button type="button" id="acceptAllCookies">Aceitar Todos</button>
                                </div>
                            </form>
                        </div>

                        <div id="tab-2" class="tab-content">
                            <p>Esta lista de cookies geralmente mostra todos os cookies encontrados neste site. Não reflete as escolhas individuais de exclusão do usuário.</p>
                            <ul id="cookieInfoList"></ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php
}