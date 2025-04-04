jQuery(document).ready(function($) {
    // Load detected cookies
    function loadDetectedCookies() {
        $.ajax({
            url: cookieManagerAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_detected_cookies',
                nonce: cookieManagerAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    var cookiesHtml = '';
                    response.data.forEach(function(cookie) {
                        cookiesHtml += '<span class="detected-cookie" data-name="' + cookie + '">' + cookie + '</span>';
                    });
                    $('#detected-cookies').html(cookiesHtml);
                }
            }
        });
    }
    
    loadDetectedCookies();
    
    // Handle detected cookie click
    $(document).on('click', '.detected-cookie', function() {
        $('#cookie-id').val('');
        $('#cookie-name').val($(this).data('name'));
    });
    
    // Handle form submission
    $('#cookie-manager-form').on('submit', function(e) {
        e.preventDefault();
        
        $.ajax({
            url: cookieManagerAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'save_cookie',
                nonce: cookieManagerAjax.nonce,
                cookie_id: $('#cookie-id').val(),
                cookie_name: $('#cookie-name').val(),
                cookie_category: $('#cookie-category').val(),
                cookie_description: $('#cookie-description').val()
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
                }
            }
        });
    });
    
    // Handle edit button click
    $('.edit-cookie').on('click', function() {
        var row = $(this).closest('tr');
        $('#cookie-id').val($(this).data('id'));
        $('#cookie-name').val(row.find('td:eq(0)').text());
        $('#cookie-category').val(row.find('td:eq(1)').text().toLowerCase());
        $('#cookie-description').val(row.find('td:eq(2)').text());
    });
    
    // Handle delete button click
    $('.delete-cookie').on('click', function() {
        if (confirm('Tem certeza que quer excluir a informação desse cookie? \nO Cookie não será excluido do site, apenas as suas informações salvas')) {
            var cookieId = $(this).data('id');
            
            $.ajax({
                url: cookieManagerAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'delete_cookie',
                    nonce: cookieManagerAjax.nonce,
                    cookie_id: cookieId
                },
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    }
                }
            });
        }
    });
});

document.getElementById("footer-left").textContent="Desenvolvido pela CRT Comunicação";