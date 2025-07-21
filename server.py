from flask import Flask, request, jsonify, send_from_directory, url_for
import fitz  # PyMuPDF
import os
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)

# Server storage settings
UPLOAD_FOLDER = "static/uploads"
ALLOWED_EXTENSIONS = {'pdf'}

# Ensure the upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_images_from_pdf(pdf_file_path):
    images = []
    pdf_document = fitz.open(pdf_file_path)

    for page_num in range(pdf_document.page_count):
        page = pdf_document.load_page(page_num)
        img_list = page.get_images(full=True)

        for img_index, img in enumerate(img_list):
            xref = img[0]
            base_image = pdf_document.extract_image(xref)
            image_bytes = base_image["image"]

            # Save the extracted image
            image_filename = f"{os.path.splitext(os.path.basename(pdf_file_path))[0]}_page_{page_num}_img_{img_index}.png"
            image_path = os.path.join(UPLOAD_FOLDER, image_filename)

            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)

            images.append(image_filename)

    return images

@app.route('/static/uploads/<filename>')
def serve_image(filename):
    """ Serve the uploaded images via the server """
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/flask_app/upload_pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format. Only PDF allowed."}), 400

    # Save PDF to server storage
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    try:
        # Extract images from the uploaded PDF
        extracted_images = extract_images_from_pdf(file_path)

        # Generate URLs for extracted images
        image_urls = [
            url_for('serve_image', filename=image, _external=True) for image in extracted_images
        ]

        return jsonify({"image_urls": image_urls}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Optionally remove the uploaded PDF after processing
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000, debug=True)