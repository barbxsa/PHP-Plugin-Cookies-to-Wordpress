jQuery(document).ready(function($) {
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
            $('#aceitar_tudo, #rejeitar_tudo').on('click', this.handleInitialConsent);
            $('#gerenciar_cookie_modal').on('click', this.openCookieManager);
            $('#cookie-ghbs-open').on('click', this.openCookieManager);
            $('.btn-close').on('click', this.closeCookieManager);
        },

        handleInitialConsent: function() {
            var consent = $(this).attr('id') === 'aceitar_tudo' ? '{"necessary":true,"performance":true,"functional":true,"advertising":true}' : '{"necessary":true,"performance":false,"functional":false,"advertising":false}';
            cookieManager.setCookie('cookie_preferences', consent, 365);
            $('.modal__before').fadeOut(300).removeClass('show');
        },

        openCookieManager: function() {
            $('.modal__before').fadeOut(300).removeClass('show');
            $('#modal_gerenciar_cookies').fadeIn(300).addClass('show');
        },

        closeCookieManager: function() {
            $('#modal_gerenciar_cookies').fadeOut(300).removeClass('show');
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
                cookieListHtml += '<b>Categoria: </b>' + category + '<br>';
                if (description) {
                    cookieListHtml += 'Descrição: ' + description;
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
            $('#modal_gerenciar_cookies').css('display', 'none')
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
            $('#modal_gerenciar_cookies').css('display', 'none')
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
            $('#modal_gerenciar_cookies').css('display', 'none')
        },

        savePreferences: function(preferences) {
            this.setCookie('cookie_preferences', JSON.stringify(preferences), 365);
            
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
            // var preferences = this.getCookie('cookie_preferences');
            // if (!preferences) {
            //     $('#modal_gerenciar_cookies').addClass('show');
            // }
            var preferences = this.getCookie('cookie_preferences');
            if (!preferences) {
                $('.modal__before').fadeIn(300).addClass('show');
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

    cookieManager.init();
});