from typing import Tuple, Union, List
import asyncio

from node_utils import Node


class OllamaQuery(Node):
    async def run(self) -> Tuple[str, str]:
        from ollama_query import ollama_query

        model_text = self.widgets[0]
        system_message_text = self.widgets[1]
        prompt_text = self.widgets[2]
        host_text = self.widgets[3]
        port_text = self.widgets[4]
        temperature_text = self.widgets[5]
        seed_text = self.widgets[6]

        if system_message_text == "":
            system_message_text = None

        if temperature_text == "":
            temperature_text = None

        if seed_text == "":
            seed_text = None

        response, debug_text = ollama_query(
            model=model_text,
            prompt=prompt_text,
            system_message=system_message_text,
            host=host_text,
            port=port_text,
            temperature=temperature_text,
        )

        return (response, debug_text)


class ShowText(Node):
    async def run(self, text: str) -> str:
        display_text = self.widgets[0]  # {"type": "textarea", "value": ""}
        await self.update_widget("display_text", text)
        return display_text


class MultiInputNode(Node):
    async def run(self, input_values: Union[str, List[str]]) -> str:
        # Handle both single value and list of values
        if isinstance(input_values, list):
            print("This was a list")
            return " ".join(input_values)
        return input_values


class ImageSource(Node):
    async def run(self) -> str:
        image_upload = self.widgets[0]  # {"type": "image_file_upload", "value": ""}
        return image_upload


class TestImageEdit(Node):
    async def run(self) -> str:
        from PIL import Image, ImageDraw
        import base64
        from io import BytesIO

        img = Image.new("RGB", (200, 200), color="white")
        draw = ImageDraw.Draw(img)
        draw.rectangle([50, 50, 150, 150], fill="red")

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        base64_str = base64.b64encode(buffered.getvalue()).decode()
        img_str = f"data:image/png;base64,{base64_str}"
        display_image = self.widgets[0]  # {"type": "image", "value": ""}
        await self.update_widget("display_image", img_str)
        return img_str


class GrayscaleImage(Node):
    async def run(self, input_image: str) -> str:
        from PIL import Image
        import base64
        from io import BytesIO

        # Extract the base64 data from the data URL
        base64_data = input_image.split(",")[1]

        # Convert base64 to PIL Image
        image_data = base64.b64decode(base64_data)
        img = Image.open(BytesIO(image_data))

        # Convert to grayscale
        grayscale_img = img.convert("L")

        # Convert back to base64
        buffered = BytesIO()
        grayscale_img.save(buffered, format="PNG")
        base64_str = base64.b64encode(buffered.getvalue()).decode()
        img_str = f"data:image/png;base64,{base64_str}"

        # Update the widget with the grayscale image
        display_image = self.widgets[0]  # {"type": "image", "value": ""}
        await self.update_widget("display_image", img_str)

        return img_str
