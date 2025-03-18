jQuery(document).ready(function($) {
    // Show modal when cookie button is clicked
    $('#cookie-ghbs-open').on('click', function() {
        $('#modal_gerenciar_cookies').addClass('show');
    });

    // Close modal when close button is clicked
    $('.btn-close').on('click', function() {
        $('#modal_gerenciar_cookies').removeClass('show');
    });

    // Handle tab switching
    $('.tab-link').click(function() {
        var tab_id = $(this).attr('data-tab');
        
        $('.tab-link').removeClass('current');
        $('.tab-content').removeClass('current');
        
        $(this).addClass('current');
        $("#" + tab_id).addClass('current');
    });

    // Cookie management functions
    var cookieManager = {
        init: function() {
            this.loadCookieList();
            this.bindEvents();
            this.checkCookieConsent();
        },

        bindEvents: function() {
            $('#cookiePreferencesForm').on('submit', this.handlePreferencesSubmit);
            $('#acceptAllCookies').on('click', this.acceptAll);
            $('#rejectAllCookies').on('click', this.rejectAll);
        },

        loadCookieList: function() {
            var cookies = document.cookie.split(';');
            var cookieListHtml = '';
            
            cookies.forEach(function(cookie) {
                var parts = cookie.split('=');
                var name = parts[0].trim();
                var category = cookieManager.getCookieCategory(name);
                var description = cookieManager.getCookieDescription(name);
                
                cookieListHtml += '<li>';
                cookieListHtml += '<strong>' + name + '</strong><br>';
                cookieListHtml += 'Categoria: ' + category + '<br>';
                if (description) {
                    cookieListHtml += 'Descricao:: ' + description;
                }
                cookieListHtml += '</li>';
            });
            
            $('#cookieInfoList').html(cookieListHtml);
        },

        getCookieCategory: function(name) {
            if (cookieManagerData.cookies) {
                var cookie = cookieManagerData.cookies.find(function(c) {
                    return c.cookie_name === name;
                });
                if (cookie) {
                    return cookie.cookie_category;
                }
            }
            return 'Sem categoria';
        },

        getCookieDescription: function(name) {
            if (cookieManagerData.cookies) {
                var cookie = cookieManagerData.cookies.find(function(c) {
                    return c.cookie_name === name;
                });
                if (cookie) {
                    return cookie.cookie_description;
                }
            }
            return '';
        },

        handlePreferencesSubmit: function(e) {
            e.preventDefault();
            
            var preferences = {
                necessary: true, 
                performance: $('input[name="desempenho"]').is(':checked'),
                functional: $('input[name="funcional"]').is(':checked'),
                advertising: $('input[name="publicidade"]').is(':checked')
            };
            
            cookieManager.savePreferences(preferences);
            $('#modal_gerenciar_cookies').removeClass('show');
        },

        acceptAll: function() {
            $('input[type="checkbox"]').prop('checked', true);
            var preferences = {
                necessary: true,
                performance: true,
                functional: true,
                advertising: true
            };
            cookieManager.savePreferences(preferences);
            $('#modal_gerenciar_cookies').removeClass('show');
        },

        rejectAll: function() {
            $('input[type="checkbox"]').not('[name="necessario"]').prop('checked', false);
            var preferences = {
                necessary: true,
                performance: false,
                functional: false,
                advertising: false
            };
            cookieManager.savePreferences(preferences);
            cookieManager.deleteCookies();
            $('#modal_gerenciar_cookies').removeClass('show');
        },

        savePreferences: function(preferences) {
            // Save preferences for 1 year
            this.setCookie('cookie_preferences', JSON.stringify(preferences), 365);
            
            // Apply preferences
            if (!preferences.performance) this.deleteCookiesByCategory('performance');
            if (!preferences.functional) this.deleteCookiesByCategory('functional');
            if (!preferences.advertising) this.deleteCookiesByCategory('advertising');
        },

        setCookie: function(name, value, days) {
            var expires = '';
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }
            document.cookie = name + '=' + value + expires + '; path=/';
        },

        deleteCookies: function() {
            var cookies = document.cookie.split(';');
            
            cookies.forEach(function(cookie) {
                var name = cookie.split('=')[0].trim();
                if (name !== 'cookie_preferences') {
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                }
            });
        },

        deleteCookiesByCategory: function(category) {
            if (cookieManagerData.cookies) {
                cookieManagerData.cookies.forEach(function(cookie) {
                    if (cookie.cookie_category.toLowerCase() === category) {
                        document.cookie = cookie.cookie_name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                    }
                });
            }
        },

        checkCookieConsent: function() {
            var preferences = this.getCookie('cookie_preferences');
            if (!preferences) {
                $('#modal_gerenciar_cookies').addClass('show');
            }
        },

        getCookie: function(name) {
            var nameEQ = name + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }
    };

    // Initialize cookie manager
    cookieManager.init();
});